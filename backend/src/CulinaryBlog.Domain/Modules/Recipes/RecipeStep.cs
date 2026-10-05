using CulinaryBlog.Domain.Common;
using CulinaryBlog.Domain.Common.Exceptions;

namespace CulinaryBlog.Domain.Modules.Recipes;

public class RecipeStep : BaseEntity
{
    public const int DescriptionMaxLength = 2000;

    public Guid RecipeId { get; private set; }
    public Recipe? Recipe { get; private set; }

    public int StepNumber { get; private set; }
    public string Title { get; private set; } = default!;
    public string Description { get; private set; } = default!;
    public int? TimerMinutes { get; private set; }
    public string? ImageUrl { get; private set; }

    private RecipeStep() { }

    public static RecipeStep Create(
        Guid recipeId,
        int stepNumber,
        string title,
        string description,
        int? timerMinutes = null,
        string? imageUrl = null)
    {
        EnsureValid(description, timerMinutes);

        return new RecipeStep
        {
            RecipeId = recipeId,
            StepNumber = stepNumber,
            Title = title,
            Description = description,
            TimerMinutes = timerMinutes,
            ImageUrl = imageUrl
        };
    }

    public void Update(string title, string description, int? timerMinutes, string? imageUrl)
    {
        EnsureValid(description, timerMinutes);

        Title = title;
        Description = description;
        TimerMinutes = timerMinutes;
        ImageUrl = imageUrl;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    /// <summary>Title hệ thống đặt khi client không gửi title.</summary>
    internal static string DefaultTitle(int stepNumber) => $"Bước {stepNumber}";

    /// <summary>
    /// StepNumber do Recipe quản lý (tự tăng khi thêm, đánh lại khi xóa), không cho client set trực tiếp.
    /// Title mặc định ("Bước n") được đổi theo số mới; title do người dùng đặt thì giữ nguyên.
    /// </summary>
    internal void Renumber(int stepNumber)
    {
        if (StepNumber == stepNumber) return;

        if (Title == DefaultTitle(StepNumber))
            Title = DefaultTitle(stepNumber);

        StepNumber = stepNumber;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    /// <summary>
    /// Invariant của bước thực hiện (FR-RCP-010): Description không rỗng, tối đa 2000 ký tự.
    /// </summary>
    private static void EnsureValid(string description, int? timerMinutes)
    {
        if (string.IsNullOrWhiteSpace(description))
            throw new BusinessRuleViolationException(ErrorCodes.StepDescriptionRequired, "Step description is required.");

        if (description.Length > DescriptionMaxLength)
            throw new BusinessRuleViolationException(ErrorCodes.StepDescriptionTooLong, $"Step description cannot exceed {DescriptionMaxLength} characters.");

        if (timerMinutes is <= 0)
            throw new BusinessRuleViolationException(ErrorCodes.StepDurationInvalid, "Step duration must be greater than zero.");
    }
}
