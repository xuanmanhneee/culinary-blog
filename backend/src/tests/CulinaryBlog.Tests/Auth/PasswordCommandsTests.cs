using CulinaryBlog.Application.Auth.Commands.Password;
using CulinaryBlog.Application.Auth.Models;
using CulinaryBlog.Application.Common.Exceptions;
using CulinaryBlog.Domain.Modules.Identity;
using Microsoft.AspNetCore.Identity;

namespace CulinaryBlog.Tests.Auth;

public sealed class PasswordCommandsTests
{
    private static ApplicationUser NewUser(bool active = true) =>
        new() { Id = "user-1", Email = "an@example.com", UserName = "an", DisplayName = "An", IsActive = active };

    private static RefreshToken ActiveToken(string userId, string hash) =>
        RefreshToken.Create(userId, hash, DateTimeOffset.UtcNow.AddDays(7));

    // ---- Validators ----

    [Theory]
    [InlineData("", false)]
    [InlineData("not-an-email", false)]
    [InlineData("an@example.com", true)]
    public void ForgotPasswordValidator_ChecksEmail(string email, bool valid) =>
        Assert.Equal(valid, new ForgotPasswordCommandValidator().Validate(new ForgotPasswordCommand(new(email))).IsValid);

    [Theory]
    [InlineData("an@example.com", "token", "Abcd@1234", true)]
    [InlineData("an@example.com", "", "Abcd@1234", false)]
    [InlineData("an@example.com", "token", "", false)]
    [InlineData("bad", "token", "Abcd@1234", false)]
    public void ResetPasswordValidator_RequiresAllFields(string email, string token, string password, bool valid) =>
        Assert.Equal(valid, new ResetPasswordCommandValidator().Validate(new ResetPasswordCommand(new(email, token, password))).IsValid);

    [Theory]
    [InlineData("old", "new", true)]
    [InlineData("", "new", false)]
    [InlineData("old", "", false)]
    public void ChangePasswordValidator_RequiresBothPasswords(string current, string next, bool valid) =>
        Assert.Equal(valid, new ChangePasswordCommandValidator().Validate(new ChangePasswordCommand("user-1", new(current, next))).IsValid);

    // ---- Forgot password ----

    [Fact]
    public async Task ForgotPassword_UnknownEmail_SendsNothingAndDoesNotThrow()
    {
        var scheduler = new FakePasswordResetScheduler();
        var handler = new ForgotPasswordCommandHandler(new FakeUserManager(), scheduler);

        await handler.Handle(new ForgotPasswordCommand(new("nobody@example.com")), default);

        Assert.Empty(scheduler.Sent);
    }

    [Fact]
    public async Task ForgotPassword_InactiveUser_SendsNothing()
    {
        var scheduler = new FakePasswordResetScheduler();
        var handler = new ForgotPasswordCommandHandler(new FakeUserManager { User = NewUser(active: false) }, scheduler);

        await handler.Handle(new ForgotPasswordCommand(new("an@example.com")), default);

        Assert.Empty(scheduler.Sent);
    }

    [Fact]
    public async Task ForgotPassword_ActiveUser_SchedulesEmailWithToken()
    {
        var scheduler = new FakePasswordResetScheduler();
        var handler = new ForgotPasswordCommandHandler(new FakeUserManager { User = NewUser(), ResetToken = "abc" }, scheduler);

        await handler.Handle(new ForgotPasswordCommand(new("  AN@example.com ")), default);

        var sent = Assert.Single(scheduler.Sent);
        Assert.Equal(("an@example.com", "An", "user-1", "abc"), sent);
    }

    // ---- Reset password ----

    [Fact]
    public async Task ResetPassword_Success_RevokesAllActiveRefreshTokens()
    {
        var tokens = new FakeRefreshTokens();
        tokens.Tokens.AddRange([ActiveToken("user-1", "a"), ActiveToken("user-1", "b"), ActiveToken("other", "c")]);
        var unitOfWork = new FakeUnitOfWork();
        var handler = new ResetPasswordCommandHandler(new FakeUserManager { User = NewUser() }, tokens, unitOfWork);

        await handler.Handle(new ResetPasswordCommand(new("an@example.com", "tok", "Newpass@1234")), default);

        Assert.All(tokens.Tokens.Where(token => token.UserId == "user-1"), token => Assert.True(token.IsRevoked));
        Assert.False(tokens.Tokens.Single(token => token.UserId == "other").IsRevoked);
        Assert.Equal(1, unitOfWork.Saves);
    }

    [Fact]
    public async Task ResetPassword_UnknownOrInactiveUser_ReportsInvalidLinkOnTokenField()
    {
        var unknown = new ResetPasswordCommandHandler(new FakeUserManager(), new FakeRefreshTokens(), new FakeUnitOfWork());
        var inactive = new ResetPasswordCommandHandler(new FakeUserManager { User = NewUser(active: false) }, new FakeRefreshTokens(), new FakeUnitOfWork());
        var command = new ResetPasswordCommand(new("an@example.com", "tok", "Newpass@1234"));

        foreach (var handler in new[] { unknown, inactive })
        {
            var error = await Assert.ThrowsAsync<ValidationException>(() => handler.Handle(command, default));
            Assert.Contains("token", error.Errors.Keys);
        }
    }

    [Fact]
    public async Task ResetPassword_InvalidToken_ReportsInvalidLinkAndKeepsSessions()
    {
        var tokens = new FakeRefreshTokens();
        tokens.Tokens.Add(ActiveToken("user-1", "a"));
        var users = new FakeUserManager
        {
            User = NewUser(),
            ResetResult = IdentityResult.Failed(new IdentityErrorDescriber().InvalidToken())
        };
        var handler = new ResetPasswordCommandHandler(users, tokens, new FakeUnitOfWork());

        var error = await Assert.ThrowsAsync<ValidationException>(() =>
            handler.Handle(new ResetPasswordCommand(new("an@example.com", "bad", "Newpass@1234")), default));

        Assert.Contains("token", error.Errors.Keys);
        Assert.False(tokens.Tokens.Single().IsRevoked);
    }

    [Fact]
    public async Task ResetPassword_WeakPassword_ReportsPasswordField()
    {
        var users = new FakeUserManager
        {
            User = NewUser(),
            ResetResult = IdentityResult.Failed(new IdentityErrorDescriber().PasswordTooShort(8))
        };
        var handler = new ResetPasswordCommandHandler(users, new FakeRefreshTokens(), new FakeUnitOfWork());

        var error = await Assert.ThrowsAsync<ValidationException>(() =>
            handler.Handle(new ResetPasswordCommand(new("an@example.com", "tok", "abc")), default));

        Assert.Contains("password", error.Errors.Keys);
    }

    // ---- Change password ----

    [Fact]
    public async Task ChangePassword_Success_RevokesAllActiveRefreshTokens()
    {
        var tokens = new FakeRefreshTokens();
        tokens.Tokens.AddRange([ActiveToken("user-1", "a"), ActiveToken("user-1", "b")]);
        var handler = new ChangePasswordCommandHandler(new FakeUserManager { User = NewUser() }, tokens, new FakeUnitOfWork());

        await handler.Handle(new ChangePasswordCommand("user-1", new("old", "Newpass@1234")), default);

        Assert.All(tokens.Tokens, token => Assert.True(token.IsRevoked));
    }

    [Fact]
    public async Task ChangePassword_UnknownUser_IsUnauthorized()
    {
        var handler = new ChangePasswordCommandHandler(new FakeUserManager(), new FakeRefreshTokens(), new FakeUnitOfWork());

        await Assert.ThrowsAsync<UnauthorizedException>(() =>
            handler.Handle(new ChangePasswordCommand("ghost", new("old", "Newpass@1234")), default));
    }

    [Fact]
    public async Task ChangePassword_AccountWithoutPassword_ReportsCurrentPasswordField()
    {
        var handler = new ChangePasswordCommandHandler(
            new FakeUserManager { User = NewUser(), UserHasPassword = false }, new FakeRefreshTokens(), new FakeUnitOfWork());

        var error = await Assert.ThrowsAsync<ValidationException>(() =>
            handler.Handle(new ChangePasswordCommand("user-1", new("old", "Newpass@1234")), default));

        Assert.Contains("currentPassword", error.Errors.Keys);
    }

    [Fact]
    public async Task ChangePassword_WrongCurrentPassword_ReportsCurrentPasswordFieldAndKeepsSessions()
    {
        var tokens = new FakeRefreshTokens();
        tokens.Tokens.Add(ActiveToken("user-1", "a"));
        var users = new FakeUserManager
        {
            User = NewUser(),
            ChangeResult = IdentityResult.Failed(new IdentityErrorDescriber().PasswordMismatch())
        };
        var handler = new ChangePasswordCommandHandler(users, tokens, new FakeUnitOfWork());

        var error = await Assert.ThrowsAsync<ValidationException>(() =>
            handler.Handle(new ChangePasswordCommand("user-1", new("bad", "Newpass@1234")), default));

        Assert.Contains("currentPassword", error.Errors.Keys);
        Assert.False(tokens.Tokens.Single().IsRevoked);
    }

    [Fact]
    public async Task ChangePassword_WeakNewPassword_ReportsPasswordField()
    {
        var users = new FakeUserManager
        {
            User = NewUser(),
            ChangeResult = IdentityResult.Failed(new IdentityErrorDescriber().PasswordRequiresDigit())
        };
        var handler = new ChangePasswordCommandHandler(users, new FakeRefreshTokens(), new FakeUnitOfWork());

        var error = await Assert.ThrowsAsync<ValidationException>(() =>
            handler.Handle(new ChangePasswordCommand("user-1", new("old", "Abcdefgh@")), default));

        Assert.Contains("password", error.Errors.Keys);
    }
}
