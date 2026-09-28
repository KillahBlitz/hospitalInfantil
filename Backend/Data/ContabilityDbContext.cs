using System;
using System.Collections.Generic;
using Backend.Models.Schemas.Contability;
using Microsoft.EntityFrameworkCore;

namespace Backend.Data;

public partial class ContabilityDbContext : DbContext
{
    public ContabilityDbContext(DbContextOptions<ContabilityDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Clave> Claves { get; set; }
    public virtual DbSet<TipoMovimientosCon> TiposMovimientosCon { get; set; }
    public virtual DbSet<MovimientoMonetario> MovimientosMonetarios { get; set; }
    public virtual DbSet<Proveedor> Proveedores { get; set; }
    public virtual DbSet<MetodoPago> MetodosPago { get; set; }
    public virtual DbSet<Productos> Productos { get; set; }
    public virtual DbSet<TipoRelacion> TiposRelacion { get; set; }
    public virtual DbSet<CuentaBancaria> CuentasBancarias { get; set; }
    public virtual DbSet<Factura> Facturas { get; set; }
    public virtual DbSet<Contrato> Contratos { get; set; }
    public virtual DbSet<PolizaContable> PolizasContables { get; set; }
    public virtual DbSet<MovimientoContable> MovimientosContables { get; set; }
    public virtual DbSet<ComplementoPago> ComplementosPago { get; set; }
    public virtual DbSet<ComplementoPagoDetallado> ComplementosPagoDetallados { get; set; }
    public virtual DbSet<MovimientoFactura> MovimientosFacturas { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Clave>(entity =>
        {
            entity.ToTable("Clave", "Contabilidad");
            entity.HasKey(e => e.IdClave);
            entity.Property(e => e.DesClaveArea)
                .HasMaxLength(2)
                .IsFixedLength()
                .IsUnicode(false);
        });

        modelBuilder.Entity<TipoMovimientosCon>(entity =>
        {
            entity.ToTable("TipoMovimientosCon", "Contabilidad");
            entity.HasKey(e => e.IdTipoMovimientosCon);
            entity.Property(e => e.TipoMovimiento)
                .HasMaxLength(25)
                .IsUnicode(false);
        });

        modelBuilder.Entity<MovimientoMonetario>(entity =>
        {
            entity.ToTable("MovimientoMonetario", "Contabilidad");
            entity.HasKey(e => e.IdMovimientoMonetario);
            entity.Property(e => e.NombreCA)
                .HasMaxLength(6)
                .IsUnicode(false);
            entity.Property(e => e.Monto)
                .HasColumnType("decimal(18, 2)");
        });

        modelBuilder.Entity<Proveedor>(entity =>
        {
            entity.ToTable("Proveedor", "Contabilidad");
            entity.HasKey(e => e.IdProveedor);
            entity.Property(e => e.NombreProveedor)
                .HasMaxLength(50)
                .IsUnicode(false);
        });

        modelBuilder.Entity<MetodoPago>(entity =>
        {
            entity.ToTable("MetodoPago", "Contabilidad");
            entity.HasKey(e => e.IdMetodoPago);
            entity.Property(e => e.TipoMetodoPago)
                .HasMaxLength(3)
                .IsUnicode(false);
            entity.Property(e => e.DescripcionMetodo)
                .HasMaxLength(100)
                .IsUnicode(false);
        });

        modelBuilder.Entity<Productos>(entity =>
        {
            entity.ToTable("Productos", "Contabilidad");
            entity.HasKey(e => e.IdProducto);
            entity.Property(e => e.NomProducto)
                .HasMaxLength(50)
                .IsUnicode(false);
        });

        modelBuilder.Entity<TipoRelacion>(entity =>
        {
            entity.ToTable("TipoRelacion", "Contabilidad");
            entity.HasKey(e => e.IdTipoRelacion);
            entity.Property(e => e.NomRelacion)
                .HasMaxLength(50)
                .IsUnicode(false);
        });

        modelBuilder.Entity<CuentaBancaria>(entity =>
        {
            entity.ToTable("CuentaBancaria", "Contabilidad");
            entity.HasKey(e => e.IdCuentaBancaria);
            entity.Property(e => e.Banco)
                .HasMaxLength(30)
                .IsUnicode(false);

            entity.HasOne(d => d.Proveedor)
                .WithMany(p => p.CuentasBancarias)
                .HasForeignKey(d => d.IdProveedor)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FkCuentaProveedor");
        });

        modelBuilder.Entity<Factura>(entity =>
        {
            entity.ToTable("Factura", "Contabilidad");
            entity.HasKey(e => e.IdFactura);
            entity.Property(e => e.FolioFiscal)
                .HasMaxLength(36)
                .IsFixedLength()
                .IsUnicode(false);
            entity.Property(e => e.ImporteFactura)
                .HasColumnType("decimal(18, 2)");
            entity.Property(e => e.Estatus)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasDefaultValue("Pendiente");

            entity.HasOne(d => d.Proveedor)
                .WithMany(p => p.Facturas)
                .HasForeignKey(d => d.IdProveedor)
                .HasConstraintName("FkIdProveedor");

            entity.HasOne(d => d.Contrato)
                .WithMany(p => p.FacturasAsociadas)
                .HasForeignKey(d => d.IdNumeroContrato)
                .HasConstraintName("FkFacturaIdNumeroContrato");
        });

        modelBuilder.Entity<Contrato>(entity =>
        {
            entity.ToTable("Contrato", "Contabilidad");
            entity.HasKey(e => e.IdNumeroContrato);

            entity.HasOne(d => d.Clave)
                .WithMany(p => p.Contratos)
                .HasForeignKey(d => d.ClaveArea)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FkClaveArea");

            entity.HasOne(d => d.Factura)
                .WithMany(p => p.ContratosConEstaFactura)
                .HasForeignKey(d => d.IdFactura)
                .HasConstraintName("FkContratoIdFactura");
        });

        modelBuilder.Entity<PolizaContable>(entity =>
        {
            entity.ToTable("PolizaContable", "Contabilidad");
            entity.HasKey(e => e.IdPoliza);
        });

        modelBuilder.Entity<MovimientoContable>(entity =>
        {
            entity.ToTable("MovimientoContable", "Contabilidad");
            entity.HasKey(e => e.IdMovimientoCont);
            entity.Property(e => e.DescripcionOriginal)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.SaldoInicial)
                .HasColumnType("decimal(18, 2)");
            entity.Property(e => e.SaldoFinal)
                .HasColumnType("decimal(18, 2)");
            entity.Property(e => e.SumaMovimientos)
                .HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.Proveedor)
                .WithMany(p => p.MovimientosContables)
                .HasForeignKey(d => d.IdProveedor)
                .HasConstraintName("FkMovimientoProveedor");

            entity.HasOne(d => d.Contrato)
                .WithMany(p => p.MovimientosContables)
                .HasForeignKey(d => d.IdNumeroContrato)
                .HasConstraintName("FkIdNumeroContrato");

            entity.HasOne(d => d.Poliza)
                .WithMany(p => p.MovimientosContables)
                .HasForeignKey(d => d.IdPoliza)
                .HasConstraintName("FkIdPoliza");

            entity.HasOne(d => d.TipoMovCon)
                .WithMany(p => p.MovimientosContables)
                .HasForeignKey(d => d.IdTipoMovCon)
                .HasConstraintName("FkIdTipoMovimientoCon");

            entity.HasOne(d => d.MovimientoMonetario)
                .WithMany(p => p.MovimientosContables)
                .HasForeignKey(d => d.IdMovimientoMonetario)
                .HasConstraintName("FkMovimientoMonetario");
        });

        modelBuilder.Entity<ComplementoPago>(entity =>
        {
            entity.ToTable("ComplementoPago", "Contabilidad");
            entity.HasKey(e => e.IdComplementoPago);
            entity.Property(e => e.FolioFiscal)
                .HasMaxLength(36)
                .IsFixedLength()
                .IsUnicode(false);
            entity.Property(e => e.MontoTotal)
                .HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.Proveedor)
                .WithMany(p => p.ComplementosPago)
                .HasForeignKey(d => d.IdProveedor)
                .HasConstraintName("FkPagoIdProveedor");

            entity.HasOne(d => d.MetodoPago)
                .WithMany(p => p.ComplementosPago)
                .HasForeignKey(d => d.IdMetodoPago)
                .HasConstraintName("FkIdMetodoPago");
        });

        modelBuilder.Entity<ComplementoPagoDetallado>(entity =>
        {
            entity.ToTable("ComplementoPagoDetallado", "Contabilidad");
            entity.HasKey(e => e.IdComplementoPagoDetallado);
            entity.Property(e => e.UuidRelacionales)
                .HasMaxLength(36)
                .IsFixedLength()
                .IsUnicode(false);
            entity.Property(e => e.Concepto)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.MontoTotal)
                .HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.ComplementoPago)
                .WithMany(p => p.ComplementosPagoDetallados)
                .HasForeignKey(d => d.IdComplementoPago)
                .HasConstraintName("FkIdComplementoPago");

            entity.HasOne(d => d.Factura)
                .WithMany(p => p.ComplementosPagoDetallados)
                .HasForeignKey(d => d.IdFactura)
                .HasConstraintName("FkDetalladoIdFactura");

            entity.HasOne(d => d.Producto)
                .WithMany(p => p.ComplementosPagoDetallados)
                .HasForeignKey(d => d.IdProducto)
                .HasConstraintName("FkIdProducto");

            entity.HasOne(d => d.TipoRelacion)
                .WithMany(p => p.ComplementosPagoDetallados)
                .HasForeignKey(d => d.IdTipoRelacion)
                .HasConstraintName("FkIdTipoRelacion");
        });

        modelBuilder.Entity<MovimientoFactura>(entity =>
        {
            entity.ToTable("MovimientoFactura", "Contabilidad");
            entity.HasKey(e => e.IdMovimientoFactura);

            entity.HasOne(d => d.MovimientoContable)
                .WithMany(p => p.MovimientosFacturas)
                .HasForeignKey(d => d.IdMovimientoContable)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FkMovFacturaIdMovimientoContable");

            entity.HasOne(d => d.Factura)
                .WithMany(p => p.MovimientosFacturas)
                .HasForeignKey(d => d.IdFactura)
                .HasConstraintName("FkMovFacturaIdFactura");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
