-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS postgis;

-- CreateTable
CREATE TABLE "Pais" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,

    CONSTRAINT "Pais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Provincia" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "idCatastro" INTEGER NOT NULL,
    "idPais" TEXT NOT NULL,

    CONSTRAINT "Provincia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Poblacion" (
    "id" TEXT NOT NULL,
    "idProvincia" TEXT NOT NULL,
    "idCatastro" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "Poblacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "rol" TEXT NOT NULL,
    "fechaRegistro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaActualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Parcela" (
    "id" TEXT NOT NULL,
    "sigpac" TEXT,
    "refCat" TEXT,
    "ptIdParcela" TEXT,
    "nombre" TEXT NOT NULL,
    "idPropietario" TEXT NOT NULL,
    "idPoblacion" TEXT,
    "geom" geometry(Polygon, 4326),
    "esParcelaReferencia" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Parcela_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cultivo" (
    "id" TEXT NOT NULL,
    "fechaInicioCampania" TIMESTAMP(3) NOT NULL,
    "superficieCultivada" DOUBLE PRECISION NOT NULL,
    "produccion" DOUBLE PRECISION NOT NULL,
    "consumoAgua" DOUBLE PRECISION NOT NULL,
    "ciclo" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "idParcela" TEXT NOT NULL,
    "idResultadoImpacto" TEXT,

    CONSTRAINT "Cultivo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResultadoImpacto" (
    "id" TEXT NOT NULL,
    "datos" JSONB NOT NULL,
    "idImpacto" TEXT NOT NULL,

    CONSTRAINT "ResultadoImpacto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetodoImpacto" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "MetodoImpacto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Pais_nombre_key" ON "Pais"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Pais_codigo_key" ON "Pais"("codigo");

-- CreateIndex
CREATE INDEX "Provincia_idPais_idx" ON "Provincia"("idPais");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Parcela_sigpac_key" ON "Parcela"("sigpac");

-- CreateIndex
CREATE UNIQUE INDEX "Parcela_refCat_key" ON "Parcela"("refCat");

-- CreateIndex
CREATE UNIQUE INDEX "Parcela_ptIdParcela_key" ON "Parcela"("ptIdParcela");

-- CreateIndex
CREATE UNIQUE INDEX "Cultivo_idResultadoImpacto_key" ON "Cultivo"("idResultadoImpacto");

-- CreateIndex
CREATE UNIQUE INDEX "Cultivo_fechaInicioCampania_idParcela_key" ON "Cultivo"("fechaInicioCampania", "idParcela");

-- AddForeignKey
ALTER TABLE "Provincia" ADD CONSTRAINT "Provincia_idPais_fkey" FOREIGN KEY ("idPais") REFERENCES "Pais"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Poblacion" ADD CONSTRAINT "Poblacion_idProvincia_fkey" FOREIGN KEY ("idProvincia") REFERENCES "Provincia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Parcela" ADD CONSTRAINT "Parcela_idPropietario_fkey" FOREIGN KEY ("idPropietario") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Parcela" ADD CONSTRAINT "Parcela_idPoblacion_fkey" FOREIGN KEY ("idPoblacion") REFERENCES "Poblacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cultivo" ADD CONSTRAINT "Cultivo_idParcela_fkey" FOREIGN KEY ("idParcela") REFERENCES "Parcela"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cultivo" ADD CONSTRAINT "Cultivo_idResultadoImpacto_fkey" FOREIGN KEY ("idResultadoImpacto") REFERENCES "ResultadoImpacto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultadoImpacto" ADD CONSTRAINT "ResultadoImpacto_idImpacto_fkey" FOREIGN KEY ("idImpacto") REFERENCES "MetodoImpacto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
