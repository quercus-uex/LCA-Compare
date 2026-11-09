-- CreateTable
CREATE TABLE "Organizacion" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "idAdministrador" TEXT NOT NULL,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Organizacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Consentimiento" (
    "id" TEXT NOT NULL,
    "idOrganizacion" TEXT NOT NULL,
    "idUsuario" TEXT NOT NULL,
    "anioCampania" INTEGER NOT NULL,
    "estado" TEXT NOT NULL,
    "fechaSolicitud" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaRespuesta" TIMESTAMP(3),
    "fechaRevocacion" TIMESTAMP(3),

    CONSTRAINT "Consentimiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notificacion" (
    "id" TEXT NOT NULL,
    "idUsuario" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "datos" JSONB NOT NULL,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notificacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Organizacion_idAdministrador_idx" ON "Organizacion"("idAdministrador");

-- CreateIndex
CREATE INDEX "Consentimiento_idUsuario_estado_idx" ON "Consentimiento"("idUsuario", "estado");

-- CreateIndex
CREATE UNIQUE INDEX "Consentimiento_idOrganizacion_idUsuario_anioCampania_key" ON "Consentimiento"("idOrganizacion", "idUsuario", "anioCampania");

-- CreateIndex
CREATE INDEX "Notificacion_idUsuario_leida_idx" ON "Notificacion"("idUsuario", "leida");

-- AddForeignKey
ALTER TABLE "Organizacion" ADD CONSTRAINT "Organizacion_idAdministrador_fkey" FOREIGN KEY ("idAdministrador") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consentimiento" ADD CONSTRAINT "Consentimiento_idOrganizacion_fkey" FOREIGN KEY ("idOrganizacion") REFERENCES "Organizacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consentimiento" ADD CONSTRAINT "Consentimiento_idUsuario_fkey" FOREIGN KEY ("idUsuario") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacion" ADD CONSTRAINT "Notificacion_idUsuario_fkey" FOREIGN KEY ("idUsuario") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
