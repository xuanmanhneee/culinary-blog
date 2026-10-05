namespace CulinaryBlog.Application.Recipes.Services;

/// <summary>
/// Rule validate dùng chung cho nguyên liệu/bước, cả khi thêm lẻ (FR-RCP-009/010)
/// lẫn khi gửi kèm lúc tạo recipe (FR-RCP-003). Prefix là đường dẫn field, ví dụ "ingredients[0].".
/// </summary>
internal static class RecipeValidation
{
    // Giới hạn theo FR-RCP-009 (Name 1–100) và cột DB (Unit 50, Notes 500).
    public const int IngredientNameMaxLength = 100;
    public const int IngredientUnitMaxLength = 50;
    public const int IngredientNotesMaxLength = 500;

    // Giới hạn theo FR-RCP-010 (Description tối đa 2000) và cột DB (Title 200, ImageUrl 500).
    public const int StepTitleMaxLength = 200;
    public const int StepDescriptionMaxLength = 2000;
    public const int StepImageUrlMaxLength = 500;

    public static void ValidateIngredient(
        IDictionary<string, string[]> errors,
        string prefix,
        string? name,
        decimal? quantity,
        string? unit,
        string? notes,
        int? orderIndex)
    {
        if (string.IsNullOrWhiteSpace(name))
            errors[prefix + "name"] = ["Tên nguyên liệu là bắt buộc."];
        else if (name.Trim().Length > IngredientNameMaxLength)
            errors[prefix + "name"] = [$"Tên nguyên liệu tối đa {IngredientNameMaxLength} ký tự."];

        // Quantity null = "vừa đủ"; phân số như 1/2 được client gửi dạng 0.5.
        if (quantity is <= 0)
            errors[prefix + "quantity"] = ["Số lượng phải lớn hơn 0."];

        if (unit?.Trim().Length > IngredientUnitMaxLength)
            errors[prefix + "unit"] = [$"Đơn vị tối đa {IngredientUnitMaxLength} ký tự."];

        if (notes?.Trim().Length > IngredientNotesMaxLength)
            errors[prefix + "notes"] = [$"Ghi chú tối đa {IngredientNotesMaxLength} ký tự."];

        if (orderIndex is < 0)
            errors[prefix + "orderIndex"] = ["Thứ tự hiển thị không được âm."];
    }

    public static void ValidateStep(
        IDictionary<string, string[]> errors,
        string prefix,
        string? title,
        string? description,
        int? timerMinutes,
        string? imageUrl)
    {
        if (title?.Trim().Length > StepTitleMaxLength)
            errors[prefix + "title"] = [$"Tiêu đề bước tối đa {StepTitleMaxLength} ký tự."];

        if (string.IsNullOrWhiteSpace(description))
            errors[prefix + "description"] = ["Mô tả bước là bắt buộc."];
        else if (description.Trim().Length > StepDescriptionMaxLength)
            errors[prefix + "description"] = [$"Mô tả bước tối đa {StepDescriptionMaxLength} ký tự."];

        if (timerMinutes is <= 0)
            errors[prefix + "timerMinutes"] = ["Thời gian của bước phải lớn hơn 0."];

        if (imageUrl?.Trim().Length > StepImageUrlMaxLength)
            errors[prefix + "imageUrl"] = [$"URL ảnh tối đa {StepImageUrlMaxLength} ký tự."];
    }

    public static string? NullIfBlank(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
