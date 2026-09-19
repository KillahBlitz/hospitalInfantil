using System;
using System.Collections.Generic;
using Backend.Models.Schemas.HumanResources;
using Microsoft.EntityFrameworkCore;

namespace Backend.Data;

public partial class HumanResourcesDbContext : DbContext
{
    public HumanResourcesDbContext(DbContextOptions<HumanResourcesDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Area> Areas { get; set; }

    public virtual DbSet<Puesto> Puestos { get; set; }

    public virtual DbSet<TipoContratacion> TiposContratacion { get; set; }

    public virtual DbSet<TipoPlaza> TiposPlaza { get; set; }

    public virtual DbSet<Unidad> Unidades { get; set; }

    public virtual DbSet<Plaza> Plazas { get; set; }

    public virtual DbSet<RegistroCodFedPuesto> RegistroCodFedPuestos { get; set; }

    public virtual DbSet<Empleado> Empleados { get; set; }

    public virtual DbSet<Comentario> Comentarios { get; set; }

    public virtual DbSet<TipoNomina> TiposNomina { get; set; }

    public virtual DbSet<RegimenSS> RegimenesSS { get; set; }

    public virtual DbSet<CatalogoImpuesto> CatalogoImpuestos { get; set; }

    public virtual DbSet<Nomina> Nominas { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Area>(entity =>
        {
            entity.ToTable("Areas", "recursos_humanos");

            entity.HasIndex(e => e.Descripcion, "UQ_Areas_Descripcion").IsUnique();

            entity.Property(e => e.Descripcion).HasMaxLength(150);
        });

        modelBuilder.Entity<Puesto>(entity =>
        {
            entity.ToTable("Puestos", "recursos_humanos");

            entity.HasIndex(e => e.CodigoPuesto, "UQ_Puestos_CodigoPuesto").IsUnique();

            entity.Property(e => e.Descripcion).HasMaxLength(150);
            entity.Property(e => e.CodigoPuesto)
                .HasMaxLength(20)
                .IsUnicode(false);
            entity.Property(e => e.GradoSalarial)
                .HasMaxLength(10)
                .IsUnicode(false);
            entity.Property(e => e.RangoSalarial).HasColumnType("decimal(16, 2)");

            entity.HasOne(d => d.Area).WithMany(p => p.Puestos)
                .HasForeignKey(d => d.AreaId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Puestos_Areas");
        });

        modelBuilder.Entity<TipoContratacion>(entity =>
        {
            entity.ToTable("TiposContratacion", "recursos_humanos");

            entity.HasIndex(e => e.Descripcion, "UQ_TiposContratacion_Descripcion").IsUnique();

            entity.Property(e => e.Descripcion).HasMaxLength(100);
        });

        modelBuilder.Entity<TipoPlaza>(entity =>
        {
            entity.ToTable("TiposPlaza", "recursos_humanos");

            entity.HasIndex(e => e.Descripcion, "UQ_TiposPlaza_Descripcion").IsUnique();

            entity.Property(e => e.Descripcion).HasMaxLength(100);
        });

        modelBuilder.Entity<Unidad>(entity =>
        {
            entity.ToTable("Unidad", "recursos_humanos");

            entity.HasIndex(e => e.Nombre, "UQ_Unidad_Unidad").IsUnique();

            entity.Property(e => e.Nombre)
                .HasColumnName("Unidad")
                .HasMaxLength(150);
            entity.Property(e => e.Ramo)
                .HasMaxLength(20)
                .IsUnicode(false);
            entity.Property(e => e.ZE)
                .HasMaxLength(10)
                .IsUnicode(false);
        });

        modelBuilder.Entity<Plaza>(entity =>
        {
            entity.ToTable("Plazas", "recursos_humanos");

            entity.Property(e => e.Ocupabilidad).HasDefaultValue(false);
            entity.Property(e => e.CodigoSHCP)
                .HasMaxLength(30)
                .IsUnicode(false);
            entity.Property(e => e.CodigoFederalPuesto)
                .HasMaxLength(30)
                .IsUnicode(false);
            entity.Property(e => e.ClavePresupuestalActual)
                .HasMaxLength(60)
                .IsUnicode(false);

            entity.HasOne(d => d.Puesto).WithMany(p => p.Plazas)
                .HasForeignKey(d => d.PuestoId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Plazas_Puestos");

            entity.HasOne(d => d.TipoContratacion).WithMany(p => p.Plazas)
                .HasForeignKey(d => d.TipoContratacionId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Plazas_TiposContratacion");

            entity.HasOne(d => d.TipoPlaza).WithMany(p => p.Plazas)
                .HasForeignKey(d => d.TipoPlazaId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Plazas_TiposPlaza");

            entity.HasOne(d => d.Unidad).WithMany(p => p.Plazas)
                .HasForeignKey(d => d.UnidadId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Plazas_Unidad");
        });

        modelBuilder.Entity<RegistroCodFedPuesto>(entity =>
        {
            entity.ToTable("RegistroCodFedPuesto", "recursos_humanos");

            entity.Property(e => e.CodigoFederalPuesto)
                .HasMaxLength(30)
                .IsUnicode(false);
            entity.Property(e => e.FechaActualizacion).HasDefaultValueSql("(getdate())");

            entity.HasOne(d => d.Plaza).WithMany(p => p.RegistroCodFedPuestos)
                .HasForeignKey(d => d.PlazaId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_RegistroCodFedPuesto_Plazas");
        });

        modelBuilder.Entity<Empleado>(entity =>
        {
            entity.ToTable("Empleados", "recursos_humanos", t =>
                t.HasCheckConstraint("CK_Empleados_Sexo", "[Sexo] IN ('M', 'H', 'X')"));

            entity.HasIndex(e => e.CURP, "UQ_Empleados_CURP").IsUnique();

            entity.HasIndex(e => e.RFC, "UQ_Empleados_RFC").IsUnique();

            entity.HasIndex(e => e.NSS, "UQ_Empleados_NSS")
                .IsUnique()
                .HasFilter("([NSS] IS NOT NULL)");

            entity.Property(e => e.Activo).HasDefaultValue(true);
            entity.Property(e => e.Nombres)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.ApellidoPaterno)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.ApellidoMaterno)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.Sexo)
                .HasMaxLength(1)
                .IsUnicode(false);
            entity.Property(e => e.CURP)
                .HasMaxLength(18)
                .IsFixedLength()
                .IsUnicode(false);
            entity.Property(e => e.RFC)
                .HasMaxLength(13)
                .IsUnicode(false);
            entity.Property(e => e.NSS)
                .HasMaxLength(11)
                .IsUnicode(false);
            entity.Property(e => e.FechaIngreso).HasDefaultValueSql("(getdate())");

            entity.HasOne(d => d.Plaza).WithMany(p => p.Empleados)
                .HasForeignKey(d => d.PlazaId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Empleados_Plazas");
        });

        modelBuilder.Entity<Comentario>(entity =>
        {
            entity.ToTable("Comentarios", "recursos_humanos");

            entity.HasIndex(e => new { e.EmpleadoId, e.NumeroComentario }, "UQ_Comentarios_Empleado_Numero").IsUnique();

            entity.Property(e => e.Texto)
                .HasColumnName("Comentario")
                .HasMaxLength(1000);
            entity.Property(e => e.TipoComentario)
                .HasMaxLength(30)
                .IsUnicode(false);

            entity.HasOne(d => d.Empleado).WithMany(p => p.Comentarios)
                .HasForeignKey(d => d.EmpleadoId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Comentarios_Empleados");
        });

        modelBuilder.Entity<TipoNomina>(entity =>
        {
            entity.ToTable("TiposNomina", "recursos_humanos");

            entity.HasIndex(e => e.Descripcion, "UQ_TiposNomina_Descripcion").IsUnique();

            entity.Property(e => e.Descripcion).HasMaxLength(100);
        });

        modelBuilder.Entity<RegimenSS>(entity =>
        {
            entity.ToTable("RegimenSS", "recursos_humanos");

            entity.HasIndex(e => e.Descripcion, "UQ_RegimenSS_Descripcion").IsUnique();

            entity.Property(e => e.Descripcion).HasMaxLength(100);
        });

        modelBuilder.Entity<CatalogoImpuesto>(entity =>
        {
            entity.ToTable("CatalogoImpuestos", "recursos_humanos");

            entity.HasIndex(e => e.Descripcion, "UQ_CatalogoImpuestos_Descripcion").IsUnique();

            entity.Property(e => e.Descripcion).HasMaxLength(150);
            entity.Property(e => e.ValorImpuesto).HasColumnType("decimal(16, 2)");
        });

        modelBuilder.Entity<Nomina>(entity =>
        {
            entity.ToTable("Nominas", "recursos_humanos");

            entity.HasIndex(
                e => new { e.EmpleadoId, e.TipoNominaId, e.NumeroQuincena, e.FechaInicial },
                "UQ_Nominas_Empleado_Periodo").IsUnique();

            entity.Property(e => e.Percepciones)
                .HasColumnType("decimal(16, 2)")
                .HasDefaultValue(0m);
            entity.Property(e => e.Deducciones)
                .HasColumnType("decimal(16, 2)")
                .HasDefaultValue(0m);
            entity.Property(e => e.Neto)
                .HasColumnType("decimal(16, 2)")
                .HasDefaultValue(0m);

            entity.HasOne(d => d.Empleado).WithMany(p => p.Nominas)
                .HasForeignKey(d => d.EmpleadoId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Nominas_Empleados");

            entity.HasOne(d => d.TipoNomina).WithMany(p => p.Nominas)
                .HasForeignKey(d => d.TipoNominaId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Nominas_TiposNomina");

            entity.HasOne(d => d.RegimenSS).WithMany(p => p.Nominas)
                .HasForeignKey(d => d.RegimenSSId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Nominas_RegimenSS");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
