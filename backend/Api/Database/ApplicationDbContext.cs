using Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Api.Database
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users { get; set; } = null!;

        // TEMP: Remove this DbSet when the real Event entity is added
        public DbSet<Event> Events { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<User>(entity =>
            {
                entity.HasIndex(u => u.Email).IsUnique();
                entity.Property(u => u.Role).HasConversion<string>();
            });

            // ── TEMP SEED — 
            modelBuilder.Entity<Event>().HasData(new Event
            {
                Id = Guid.Parse("a1b2c3d4-e5f6-7890-abcd-ef1234567890"),
                Name = "Named Summer Festival 2026",
                Description = "The biggest summer event in the Baltics — live music, food trucks, art installations and more. Join us for an unforgettable weekend!",
                Date = new DateTime(2026, 7, 15, 18, 0, 0, DateTimeKind.Utc),
                Location = "Vingis Park, Vilnius, Lithuania",
                PriceInCents = 2500,   // 25.00
                Currency = "eur",
                ImageUrl = "",
                AvailableTickets = 500
            });
        }
    }
}