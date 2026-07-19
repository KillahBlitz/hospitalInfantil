using System;
using System.Collections.Generic;
using Backend.Models.Schemas.UserAccess;
using Microsoft.EntityFrameworkCore;

namespace Backend.Data;

public partial class UserAccessDbContext : DbContext
{
    public UserAccessDbContext(DbContextOptions<UserAccessDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Area> Areas { get; set; }

    public virtual DbSet<Modulo> Modulos { get; set; }

    public virtual DbSet<Permiso> Permisos { get; set; }

    public virtual DbSet<TipoUsuario> TipoUsuarios { get; set; }

    public virtual DbSet<Usuario> Usuarios { get; set; }

    public virtual DbSet<UsuarioModuloPermiso> UsuarioModuloPermisos { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Area>(entity =>
        {
            entity.ToTable("Areas", "acceso_usuario");

            entity.HasIndex(e => e.Nombre, "UQ_Areas_Nombre").IsUnique();

            entity.Property(e => e.Activo).HasDefaultValue(true);
            entity.Property(e => e.Descripcion).HasMaxLength(250);
            entity.Property(e => e.Nombre).HasMaxLength(30);
        });

        modelBuilder.Entity<Modulo>(entity =>
        {
            entity.ToTable("Modulos", "acceso_usuario");

            entity.HasIndex(e => new { e.AreaId, e.Nombre }, "UQ_Modulos_Area_Nombre").IsUnique();

            entity.Property(e => e.Activo).HasDefaultValue(true);
            entity.Property(e => e.Descripcion).HasMaxLength(250);
            entity.Property(e => e.Nombre).HasMaxLength(100);

            entity.HasOne(d => d.Area).WithMany(p => p.Modulos)
                .HasForeignKey(d => d.AreaId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Modulos_Areas");
        });

        modelBuilder.Entity<Permiso>(entity =>
        {
            entity.ToTable("Permisos", "acceso_usuario");

            entity.HasIndex(e => e.Nombre, "UQ_Permisos_Nombre").IsUnique();

            entity.Property(e => e.Descripcion).HasMaxLength(150);
            entity.Property(e => e.Nombre)
                .HasMaxLength(15)
                .IsUnicode(false);
        });

        modelBuilder.Entity<TipoUsuario>(entity =>
        {
            entity.ToTable("TipoUsuario", "acceso_usuario");

            entity.Property(e => e.Descripcion).HasMaxLength(150);
            entity.Property(e => e.NivelUsuario)
                .HasMaxLength(15)
                .IsUnicode(false);
        });

        modelBuilder.Entity<Usuario>(entity =>
        {
            entity.ToTable("Usuarios", "acceso_usuario");

            entity.HasIndex(e => e.Alias, "UQ_Usuarios_Alias").IsUnique();

            entity.HasIndex(e => e.Correo, "UQ_Usuarios_Correo").IsUnique();

            entity.Property(e => e.Activo).HasDefaultValue(true);
            entity.Property(e => e.Alias)
                .HasMaxLength(10)
                .IsUnicode(false);
            entity.Property(e => e.ApellidoMaterno)
                .HasMaxLength(20)
                .IsUnicode(false);
            entity.Property(e => e.ApellidoPaterno)
                .HasMaxLength(20)
                .IsUnicode(false);
            entity.Property(e => e.Correo).HasMaxLength(100);
            entity.Property(e => e.FechaIngreso).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.Nombre)
                .HasMaxLength(30)
                .IsUnicode(false);
            entity.Property(e => e.PasswordHash).HasMaxLength(500);
            entity.Property(e => e.Sexo)
                .HasMaxLength(1)
                .IsUnicode(false);

            entity.HasOne(d => d.Tipo).WithMany(p => p.Usuarios)
                .HasForeignKey(d => d.TipoId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Usuarios_TipoUsuario");
        });

        modelBuilder.Entity<UsuarioModuloPermiso>(entity =>
        {
            entity.HasKey(e => new { e.UsuarioId, e.ModuloId, e.PermisoId });

            entity.ToTable("UsuarioModuloPermisos", "acceso_usuario");

            entity.HasOne(d => d.Modulo).WithMany(p => p.UsuarioModuloPermisos)
                .HasForeignKey(d => d.ModuloId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_UsuarioModuloPermisos_Modulos");

            entity.HasOne(d => d.Permiso).WithMany(p => p.UsuarioModuloPermisos)
                .HasForeignKey(d => d.PermisoId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_UsuarioModuloPermisos_Permisos");

            entity.HasOne(d => d.Usuario).WithMany(p => p.UsuarioModuloPermisos)
                .HasForeignKey(d => d.UsuarioId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_UsuarioModuloPermisos_Usuarios");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
