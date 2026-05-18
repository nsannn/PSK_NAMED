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
        public DbSet<Event> Events { get; set; }
        public DbSet<Ticket> Tickets { get; set; }
        public DbSet<Tag> Tags { get; set; }
        public DbSet<PurchasedTicket> PurchasedTickets { get; set; }
        public DbSet<Order> Orders { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<User>(entity =>
            {
                entity.HasIndex(u => u.Email).IsUnique();
                entity.Property(u => u.Role).HasConversion<string>();
            });
            
            modelBuilder.Entity<Order>(entity =>
            {
                entity.Property(o => o.Status).HasConversion<string>();
            });

            modelBuilder.Entity<Event>()
                .HasMany(e => e.Tags)
                .WithMany(t => t.Events);
                
            modelBuilder.Entity<Event>()
                .HasOne(e => e.CreatedByUser)
                .WithMany()
                .HasForeignKey(e => e.CreatedByUserId)
                .OnDelete(DeleteBehavior.SetNull);
            
            modelBuilder.Entity<PurchasedTicket>(entity => {
                entity.HasIndex(t => t.UserId);
                entity.HasIndex(t => t.EventId);
                entity.Property(t => t.Status).HasConversion<string>();
                entity.HasOne(t => t.Event)
                    .WithMany()
                    .HasForeignKey(t => t.EventId)
                    .OnDelete(DeleteBehavior.SetNull);
                entity.HasOne(t => t.Ticket)
                    .WithMany()
                    .HasForeignKey(t => t.TicketId)
                    .OnDelete(DeleteBehavior.SetNull);
            });
        }
    }
}
