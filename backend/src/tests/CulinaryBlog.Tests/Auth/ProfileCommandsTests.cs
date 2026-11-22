using System.Text;
using CulinaryBlog.Application.Auth.Commands.UpdateCurrentUser;
using CulinaryBlog.Application.Auth.Commands.UploadAvatar;
using CulinaryBlog.Application.Auth.Models;
using CulinaryBlog.Application.Common.Exceptions;
using CulinaryBlog.Domain.Modules.Identity;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging.Abstractions;

namespace CulinaryBlog.Tests.Auth;

public sealed class ProfileCommandsTests
{
    private static readonly byte[] PngBytes =
        [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52];

    private static ApplicationUser NewUser(string? avatarUrl = null) =>
        new() { Id = Guid.NewGuid().ToString(), Email = "an@example.com", UserName = "an", DisplayName = "An", AvatarUrl = avatarUrl };

    private static IFormFile File(byte[] content, string contentType = "image/png") =>
        new FormFile(new MemoryStream(content), 0, content.Length, "file", "avatar.png") { Headers = new HeaderDictionary(), ContentType = contentType };

    private static UploadAvatarCommandHandler AvatarHandler(FakeUserManager users, FakeFileStorage storage, FakeFileDeletionScheduler deletions) =>
        new(users, storage, deletions, NullLogger<UploadAvatarCommandHandler>.Instance);

    // ---- Upload avatar: validator ----

    [Fact]
    public void UploadAvatarValidator_AcceptsSupportedImage() =>
        Assert.True(new UploadAvatarCommandValidator().Validate(new UploadAvatarCommand("u", File(PngBytes))).IsValid);

    [Fact]
    public void UploadAvatarValidator_RejectsEmptyFile() =>
        Assert.False(new UploadAvatarCommandValidator().Validate(new UploadAvatarCommand("u", File([]))).IsValid);

    [Fact]
    public void UploadAvatarValidator_RejectsUnsupportedContentType() =>
        Assert.False(new UploadAvatarCommandValidator().Validate(new UploadAvatarCommand("u", File(PngBytes, "image/gif"))).IsValid);

    [Fact]
    public void UploadAvatarValidator_RejectsFileOverFiveMegabytes() =>
        Assert.False(new UploadAvatarCommandValidator().Validate(new UploadAvatarCommand("u", File(new byte[5 * 1024 * 1024 + 1]))).IsValid);

    // ---- Upload avatar: handler ----

    [Fact]
    public async Task UploadAvatar_UnknownUser_IsNotFound()
    {
        var handler = AvatarHandler(new FakeUserManager(), new FakeFileStorage(), new FakeFileDeletionScheduler());

        await Assert.ThrowsAsync<NotFoundException>(() => handler.Handle(new UploadAvatarCommand("ghost", File(PngBytes)), default));
    }

    [Fact]
    public async Task UploadAvatar_FileContentNotAnImage_IsRejectedBeforeStoring()
    {
        var storage = new FakeFileStorage();
        var users = new FakeUserManager { User = NewUser() };
        var handler = AvatarHandler(users, storage, new FakeFileDeletionScheduler());

        await Assert.ThrowsAsync<ValidationException>(() =>
            handler.Handle(new UploadAvatarCommand(users.User.Id, File(Encoding.ASCII.GetBytes("this is plain text, not a png"))), default));

        Assert.Equal(0, users.UpdateCalls);
    }

    [Fact]
    public async Task UploadAvatar_Success_SetsAvatarAndSchedulesDeletionOfPreviousUploadOnSameStorage()
    {
        var previous = "http://storage.test/culinary-blog/recipes/old/uploads/old.png";
        var users = new FakeUserManager { User = NewUser(previous) };
        var storage = new FakeFileStorage();
        var deletions = new FakeFileDeletionScheduler();

        var profile = await AvatarHandler(users, storage, deletions)
            .Handle(new UploadAvatarCommand(users.User.Id, File(PngBytes)), default);

        Assert.Equal(storage.UploadedUrl, profile.AvatarUrl);
        Assert.Equal(storage.UploadedUrl, users.User.AvatarUrl);
        Assert.Equal([previous], deletions.Deleted);
    }

    [Fact]
    public async Task UploadAvatar_PreviousAvatarFromExternalHost_IsNeverDeleted()
    {
        var users = new FakeUserManager { User = NewUser("https://lh3.googleusercontent.com/a/photo.jpg") };
        var deletions = new FakeFileDeletionScheduler();

        await AvatarHandler(users, new FakeFileStorage(), deletions)
            .Handle(new UploadAvatarCommand(users.User.Id, File(PngBytes)), default);

        Assert.Empty(deletions.Deleted);
    }

    [Fact]
    public async Task UploadAvatar_UpdateFails_RemovesOrphanedUploadAndKeepsOldAvatarScheduleEmpty()
    {
        var users = new FakeUserManager
        {
            User = NewUser("http://storage.test/culinary-blog/recipes/old/uploads/old.png"),
            UpdateResult = IdentityResult.Failed(new IdentityError { Code = "Boom", Description = "fail" })
        };
        var storage = new FakeFileStorage();
        var deletions = new FakeFileDeletionScheduler();

        await Assert.ThrowsAsync<ValidationException>(() =>
            AvatarHandler(users, storage, deletions).Handle(new UploadAvatarCommand(users.User.Id, File(PngBytes)), default));

        Assert.Equal([storage.UploadedUrl], storage.Removed);
        Assert.Empty(deletions.Deleted);
    }

    // ---- Update profile: bio ----

    private static async Task<UserProfileDto> Update(FakeUserManager users, UpdateProfileRequest request) =>
        await new UpdateCurrentUserCommandHandler(users).Handle(new UpdateCurrentUserCommand(users.User!.Id, request), default);

    [Fact]
    public async Task UpdateProfile_Bio_IsTrimmedAndSaved()
    {
        var users = new FakeUserManager { User = NewUser() };

        var profile = await Update(users, new(null, null, "  Mê nấu ăn  "));

        Assert.Equal("Mê nấu ăn", profile.Bio);
        Assert.Equal("Mê nấu ăn", users.User!.Bio);
    }

    [Fact]
    public async Task UpdateProfile_EmptyBio_ClearsIt()
    {
        var users = new FakeUserManager { User = NewUser() };
        users.User!.Bio = "cũ";

        await Update(users, new(null, null, "   "));

        Assert.Null(users.User.Bio);
    }

    [Fact]
    public async Task UpdateProfile_NullBio_LeavesItUntouched()
    {
        var users = new FakeUserManager { User = NewUser() };
        users.User!.Bio = "giữ nguyên";

        await Update(users, new("Tên mới", null, null));

        Assert.Equal("giữ nguyên", users.User.Bio);
        Assert.Equal("Tên mới", users.User.DisplayName);
    }

    [Fact]
    public async Task UpdateProfile_EmptyAvatarUrl_RemovesAvatar()
    {
        var users = new FakeUserManager { User = NewUser("http://storage.test/a.png") };

        await Update(users, new(null, "", null));

        Assert.Null(users.User!.AvatarUrl);
    }

    [Theory]
    [InlineData(500, true)]
    [InlineData(501, false)]
    public void UpdateProfileValidator_LimitsBioTo500Characters(int length, bool valid) =>
        Assert.Equal(valid, new UpdateCurrentUserCommandValidator()
            .Validate(new UpdateCurrentUserCommand("u", new(null, null, new string('a', length)))).IsValid);
}
