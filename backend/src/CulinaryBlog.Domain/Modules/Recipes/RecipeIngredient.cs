using CulinaryBlog.Domain.Common;
using CulinaryBlog.Domain.Common.Exceptions;

namespace CulinaryBlog.Domain.Modules.Recipes;

public class RecipeIngredient : BaseEntity
{
    public Guid RecipeId { get; private set; }
    public Recipe? Recipe { get; private set; }

    public string Name { get; private set; } = default!;
    public decimal? Quantity { get; private set; }
    public string? Unit { get; private set; }
    public string? Notes { get; private set; }
    public int OrderIndex { get; private set; }

    private RecipeIngredient() { }

    public static RecipeIngredient Create(Guid recipeId, string name, decimal? quantity, string? unit, int orderIndex, string? notes = null)
    {
        EnsureValid(name, quantity, orderIndex);

        return new RecipeIngredient
        {
            RecipeId = recipeId,
            Name = name,
            Quantity = quantity,
            Unit = unit,
            OrderIndex = orderIndex,
            Notes = notes
        };
    }

    public void Update(string name, decimal? quantity, string? unit, int orderIndex, string? notes = null)
    {
        EnsureValid(name, quantity, orderIndex);

        Name = name;
        Quantity = quantity;
        Unit = unit;
        OrderIndex = orderIndex;
        Notes = notes;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    /// <summary>
    /// Invariant của nguyên liệu (FR-RCP-009). Application đã validate trước để trả lỗi theo field;
    /// đây là lớp bảo vệ cuối để entity không bao giờ ở trạng thái sai.
    /// </summary>
    private static void EnsureValid(string name, decimal? quantity, int orderIndex)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new BusinessRuleViolationException(ErrorCodes.IngredientNameRequired, "Ingredient name is required.");

        if (quantity is <= 0)
            throw new BusinessRuleViolationException(ErrorCodes.IngredientQuantityInvalid, "Ingredient quantity must be greater than zero.");

        if (orderIndex < 0)
            throw new BusinessRuleViolationException(ErrorCodes.IngredientOrderIndexInvalid ,"Ingredient order index cannot be negative.");
    }
}   
