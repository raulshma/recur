using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RecurApi.Data;
using RecurApi.DTOs;
using RecurApi.Models;

namespace RecurApi.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class CategoriesController : ControllerBase
{
    private readonly RecurDbContext _context;

    public CategoriesController(RecurDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<CategoryDto>>> GetCategories()
    {
        var categories = await _context.Categories
            .OrderBy(c => c.Name)
            .Select(c => new CategoryDto
            {
                Id = c.Id,
                Name = c.Name,
                Description = c.Description,
                Color = c.Color,
                IsDefault = c.IsDefault,
                CreatedAt = c.CreatedAt
            })
            .ToListAsync();

        return Ok(categories);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<CategoryDto>> GetCategory(int id)
    {
        var category = await _context.Categories.FindAsync(id);

        if (category == null)
        {
            return NotFound();
        }

        return Ok(new CategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            Description = category.Description,
            Color = category.Color,
            IsDefault = category.IsDefault,
            CreatedAt = category.CreatedAt
        });
    }

    [HttpPost]
    public async Task<ActionResult<CategoryDto>> CreateCategory(CreateCategoryDto model)
    {
        // Check if category name already exists
        if (await _context.Categories.AnyAsync(c => c.Name == model.Name))
        {
            return BadRequest("A category with this name already exists");
        }

        var category = new Category
        {
            Name = model.Name,
            Description = model.Description,
            Color = model.Color,
            IsDefault = false,
            CreatedAt = DateTime.UtcNow
        };

        _context.Categories.Add(category);
        await _context.SaveChangesAsync();

        var categoryDto = new CategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            Description = category.Description,
            Color = category.Color,
            IsDefault = category.IsDefault,
            CreatedAt = category.CreatedAt
        };

        return CreatedAtAction(nameof(GetCategory), new { id = category.Id }, categoryDto);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateCategory(int id, UpdateCategoryDto model)
    {
        var category = await _context.Categories.FindAsync(id);

        if (category == null)
        {
            return NotFound();
        }

        // Prevent updating default categories
        if (category.IsDefault)
        {
            return BadRequest("Cannot modify default categories");
        }

        // Check if new name conflicts with existing categories (excluding current)
        if (await _context.Categories.AnyAsync(c => c.Name == model.Name && c.Id != id))
        {
            return BadRequest("A category with this name already exists");
        }

        category.Name = model.Name;
        category.Description = model.Description;
        category.Color = model.Color;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteCategory(int id)
    {
        var category = await _context.Categories
            .Include(c => c.Subscriptions)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (category == null)
        {
            return NotFound();
        }

        // Prevent deleting default categories
        if (category.IsDefault)
        {
            return BadRequest("Cannot delete default categories");
        }

        // Check if category has subscriptions
        if (category.Subscriptions.Any())
        {
            return BadRequest("Cannot delete category that has subscriptions. Please move subscriptions to another category first.");
        }

        _context.Categories.Remove(category);
        await _context.SaveChangesAsync();

        return NoContent();
    }
} 