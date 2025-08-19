using Microsoft.EntityFrameworkCore;
using backend.Models;

namespace backend.Data
{
    public class ChatDbContext : DbContext
    {
        public DbSet<User> Users { get; set; }
        public DbSet<Message> Messages { get; set; }

        public ChatDbContext(DbContextOptions<ChatDbContext> options) : base(options) { }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<User>().HasIndex(u => u.Username).IsUnique();
        }
    }
}