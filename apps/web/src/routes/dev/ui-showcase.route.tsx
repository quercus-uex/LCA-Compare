// Catálogo de la librería de componentes. Solo existe en desarrollo (/dev/ui), así que sus
// textos no pasan por i18n: es una herramienta para quien desarrolla, no una vista de la app
import { type ReactNode, useId, useState } from 'react';
import { FiBarChart2, FiBell, FiDownload, FiGrid, FiList, FiMap, FiPlus, FiSearch, FiSend, FiSettings, FiTrash2, FiUserMinus, FiUsers } from 'react-icons/fi';
import {
  Badge,
  Breadcrumbs,
  Button,
  ButtonLink,
  ButtonNavLink,
  Callout,
  Card,
  CardLink,
  Checkbox,
  ColorDot,
  ConfirmDialog,
  DatePicker,
  Dialog,
  Dropdown,
  EmptyState,
  ErrorAlert,
  Field,
  IconButton,
  Input,
  Menu,
  MenuItem,
  MenuTitle,
  Page,
  PageHeader,
  Section,
  SectionHeader,
  SegmentedControl,
  Select,
  Skeleton,
  Spinner,
  TabPanel,
  Tabs,
  Textarea,
  Toggle,
  ToggleButton,
  type BadgeTone,
  type ButtonVariant,
  type CalloutTone,
} from '../../components/ui/index.ts';

const BUTTON_VARIANTS: { variant: ButtonVariant; use: string }[] = [
  { variant: 'primary', use: 'La acción principal del bloque. Solo una por bloque.' },
  { variant: 'secondary', use: 'Acción destacada que acompaña a la principal o la sustituye.' },
  { variant: 'outline', use: 'Acción secundaria visible: ver detalle, exportar, transferir.' },
  { variant: 'ghost', use: 'Acción de bajo peso: cancelar, marcar como leído.' },
  { variant: 'danger', use: 'Confirmar una acción destructiva (en el diálogo de confirmación).' },
  { variant: 'danger-ghost', use: 'Acción destructiva que no es la principal: expulsar, cerrar sesión.' },
];

const BADGE_TONES: { tone: BadgeTone; label: string }[] = [
  { tone: 'neutral', label: 'EF 3.1' },
  { tone: 'primary', label: 'Actual' },
  { tone: 'secondary', label: 'Admin' },
  { tone: 'success', label: 'Aceptada' },
  { tone: 'warning', label: 'Pendiente' },
  { tone: 'error', label: 'Rechazada' },
];

const CALLOUT_TONES: { tone: CalloutTone; text: string }[] = [
  { tone: 'info', text: 'Estás viendo la parcela de un miembro de la organización, en solo lectura.' },
  { tone: 'warning', text: 'La organización verá tus datos de las campañas que aceptes.' },
  { tone: 'error', text: 'No se ha podido guardar la organización.' },
  { tone: 'neutral', text: 'Solo el administrador de cada organización puede revocar las campañas que aceptes.' },
];

const TABS = [
  { id: 'miembros', label: 'Miembros', icon: FiUsers },
  { id: 'solicitar', label: 'Solicitar acceso', icon: FiSend },
  { id: 'ajustes', label: 'Ajustes', icon: FiSettings },
] as const;

/** Bloque del catálogo: nombre del componente, cuándo usarlo y sus ejemplos */
const Showcase = ({ name, use, children }: { name: string; use: string; children: ReactNode }) => (
  <Card as="section" aria-label={name}>
    <div className="flex flex-col gap-1">
      <h2 className="font-mono text-lg font-semibold">{name}</h2>
      <p className="text-sm text-muted">{use}</p>
    </div>
    <div className="flex flex-col gap-5">{children}</div>
  </Card>
);

/** Ejemplo con su código */
const Example = ({ code, children }: { code: string; children: ReactNode }) => (
  <div className="flex flex-col gap-2">
    <div className="flex flex-wrap items-center gap-3">{children}</div>
    <code className="w-fit max-w-full overflow-x-auto rounded-field bg-base-200 px-2 py-1 font-mono text-xs">{code}</code>
  </div>
);

const Group = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="flex flex-col gap-6">
    <h2 className="eyebrow border-b border-base-content/10 pb-2">{title}</h2>
    {children}
  </div>
);

export const UiShowcaseRoute = () => {
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('miembros');
  const [years, setYears] = useState<number[]>([2025]);
  const [pais, setPais] = useState('ES');
  const [dialog, setDialog] = useState<'form' | 'confirm' | null>(null);
  const [toggle, setToggle] = useState(true);
  const [fecha, setFecha] = useState('2025-11-05');
  const [fechaOpcional, setFechaOpcional] = useState('');
  const tabsId = useId();

  return (
    <Page>
      <PageHeader
        title="Librería de componentes"
        subtitle="Piezas de components/ui con sus variantes. Importa desde components/ui/index.ts."
        aside={<Badge tone="warning">Solo en desarrollo</Badge>}
      />

      <Group title="Tokens">
        <Showcase name="text-muted · text-danger · text-favorable · eyebrow" use="Colores de texto semánticos y etiqueta de grupo, definidos en index.css. Cumplen el contraste AA.">
          <Example code={'<p className="text-muted">…</p>'}>
            <p className="text-muted">Texto secundario: fechas, ayudas, unidades.</p>
          </Example>
          <Example code={'<p className="text-danger">…</p>'}>
            <p className="text-danger">Texto de error o de una acción destructiva.</p>
          </Example>
          <Example code={'<p className="text-favorable">…</p>'}>
            <p className="text-favorable">Valor favorable: −12,4 % frente a la referencia.</p>
          </Example>
          <Example code={'<span className="eyebrow">Tus campañas</span>'}>
            <span className="eyebrow">Tus campañas</span>
          </Example>
        </Showcase>
      </Group>

      <Group title="Acciones">
        <Showcase name="Button" use="Elige la variante por intención, no por aspecto.">
          {BUTTON_VARIANTS.map(({ variant, use }) => (
            <Example key={variant} code={`<Button variant="${variant}">`}>
              <Button variant={variant}>Guardar</Button>
              <Button variant={variant} icon={FiDownload}>Exportar</Button>
              <Button variant={variant} loading>Guardando</Button>
              <Button variant={variant} disabled>Desactivado</Button>
              <span className="text-sm text-muted">{use}</span>
            </Example>
          ))}
          <Example code={'<Button variant="primary" size="xs | sm | md | lg">'}>
            <Button variant="primary" size="xs">xs</Button>
            <Button variant="primary" size="sm">sm</Button>
            <Button variant="primary">md</Button>
            <Button variant="primary" size="lg">lg</Button>
          </Example>
        </Showcase>

        <Showcase name="ButtonLink" use="Navegación con aspecto de botón: interna con to, externa con href (abre otra pestaña).">
          <Example code={'<ButtonLink variant="outline" to="/parcelas" icon={FiMap}>'}>
            <ButtonLink variant="outline" to="/parcelas" icon={FiMap}>Ver parcelas</ButtonLink>
            <ButtonLink variant="primary" href="https://example.com">Documentación</ButtonLink>
          </Example>
        </Showcase>

        <Showcase name="ButtonNavLink" use="Enlace de la navegación principal: se resalta cuando su sección está activa. isActive corrige el cálculo del router.">
          <Example code={'<ButtonNavLink to="/dev/ui">'}>
            <ButtonNavLink to="/dev/ui">Catálogo (activo)</ButtonNavLink>
            <ButtonNavLink to="/parcelas">Mis parcelas</ButtonNavLink>
          </Example>
        </Showcase>

        <Showcase name="IconButton" use="Botón de solo icono. label es obligatorio: da el nombre accesible y el tooltip.">
          <Example code={'<IconButton icon={FiSettings} label="Ajustes" />'}>
            <IconButton icon={FiSettings} label="Ajustes" />
            <IconButton icon={FiPlus} label="Añadir" variant="outline" />
            <IconButton icon={FiTrash2} label="Eliminar" variant="danger-ghost" />
            <IconButton icon={FiTrash2} label="Eliminar" variant="danger-ghost" size="xs" />
          </Example>
          <Example code={'<IconButton icon={<BellIcon total={3} />} label="…" />'}>
            <IconButton
              label="Notificaciones (3)"
              size="md"
              icon={<span className="indicator"><FiBell aria-hidden className="size-5" /><Badge aria-hidden tone="secondary" size="xs" className="indicator-item">3</Badge></span>}
            />
            <span className="text-sm text-muted">Si el icono necesita algo más (un contador), se pasa el elemento ya pintado.</span>
          </Example>
        </Showcase>

        <Showcase name="ToggleButton · SegmentedControl" use="ToggleButton se activa y desactiva por separado (varias a la vez); SegmentedControl es una elección única entre pocas opciones.">
          <Example code={'<ToggleButton pressed={…} onClick={…}>2025</ToggleButton>'}>
            {[2023, 2024, 2025, 2026].map((anio) => (
              <ToggleButton
                key={anio}
                size="sm"
                pressed={years.includes(anio)}
                onClick={() => setYears((ys) => ys.includes(anio) ? ys.filter((y) => y !== anio) : [...ys, anio])}
              >
                {anio}
              </ToggleButton>
            ))}
          </Example>
          <Example code={'<SegmentedControl label="País" options={…} value={…} onChange={…} />'}>
            <SegmentedControl label="País" options={[{ value: 'ES', label: 'España' }, { value: 'PT', label: 'Portugal' }]} value={pais} onChange={setPais} />
            <SegmentedControl
              label="Vista"
              size="sm"
              mdSize="md"
              options={[{ value: 'tarjetas', label: 'Tarjetas', icon: FiGrid }, { value: 'tabla', label: 'Tabla', icon: FiList }]}
              value="tarjetas"
              onChange={() => undefined}
            />
            <SegmentedControl label="Idioma" size="xs" options={[{ value: 'es', label: 'ES' }, { value: 'en', label: 'EN' }, { value: 'pt', label: 'PT' }]} value="es" onChange={() => undefined} />
          </Example>
        </Showcase>

        <Showcase name="Dropdown · Menu" use="Se cierra al elegir una opción o con Escape. align=&quot;end&quot; (por defecto) para los de la derecha de la pantalla.">
          <Example code={'<Dropdown variant="outline" align="start" trigger="Exportar"><Menu><MenuItem …/></Menu></Dropdown>'}>
            <Dropdown variant="outline" size="sm" align="start" trigger={<><FiDownload aria-hidden />Exportar</>}>
              <Menu>
                <MenuTitle>Comparativa</MenuTitle>
                <MenuItem onClick={() => undefined}>JSON</MenuItem>
                <MenuItem onClick={() => undefined}>CSV</MenuItem>
                <MenuTitle>Navegación</MenuTitle>
                <MenuItem to="/dev/ui" active>Catálogo (activa)</MenuItem>
                <MenuItem href="https://example.com">Documentación</MenuItem>
                <MenuItem onClick={() => undefined} danger>Eliminar</MenuItem>
              </Menu>
            </Dropdown>
          </Example>
        </Showcase>
      </Group>

      <Group title="Datos">
        <Showcase name="Badge · ColorDot" use="Etiquetas de estado o categoría. El color nunca va solo: acompáñalo de texto o icono.">
          <Example code={'<Badge tone="success" icon={…}>Aceptada</Badge>'}>
            {BADGE_TONES.map(({ tone, label }) => <Badge key={tone} tone={tone}>{label}</Badge>)}
          </Example>
          <Example code={'<Badge size="xs | sm | md">'}>
            <Badge tone="primary" size="xs">xs</Badge>
            <Badge tone="primary" size="sm">sm</Badge>
            <Badge tone="primary">md</Badge>
          </Example>
          <Example code={'<Badge tone="outline" color="#22c55e" icon={…}>Viñedo</Badge>'}>
            <Badge tone="outline" color="#7c3aed" icon={FiBarChart2}>Viñedo</Badge>
            <span className="flex items-center gap-1.5 text-sm"><ColorDot color="#ef4444" />Cambio climático</span>
            <span className="flex items-center gap-1.5 text-sm"><ColorDot color="#3b82f6" size="sm" />Uso del agua</span>
          </Example>
        </Showcase>
      </Group>

      <Group title="Formularios">
        <Showcase name="Field · Input · Select · Textarea" use="Field enlaza etiqueta, ayuda y error con el control (ids y aria-describedby automáticos).">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Nombre" hint="Lo verán los miembros al recibir la solicitud." required>
              <Input placeholder="Cooperativa Tierra de Barros" />
            </Field>
            <Field label="Email" error="No hay ningún usuario con ese email." required>
              <Input type="email" defaultValue="nadie@example.com" />
            </Field>
            <Field label="Nuevo administrador">
              <Select defaultValue="">
                <option value="" disabled>Elige un miembro</option>
                <option>Usuario Ejemplo 2</option>
              </Select>
            </Field>
            <Field label="Buscar">
              <Input icon={FiSearch} type="search" placeholder="Nombre, SIGPAC o referencia catastral" />
            </Field>
            <Field label="Descripción" hint="Opcional" className="md:col-span-2">
              <Textarea rows={3} />
            </Field>
          </div>
          <Example code={'<Input size="sm" aria-label="…" /> · <Select size="sm" aria-label="…" />'}>
            <div className="w-56"><Input size="sm" aria-label="Buscar población" placeholder="Buscar población…" /></div>
            <div className="w-56">
              <Select size="sm" aria-label="Orden">
                <option>Más recientes</option>
              </Select>
            </div>
          </Example>
        </Showcase>

        <Showcase name="DatePicker" use="Fecha con calendario. Teclado: flechas (día y semana), Inicio/Fin (semana), Re Pág/Av Pág (mes; con Mayús, año), Escape para cerrar.">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="Fecha de inicio de campaña" required>
              <DatePicker value={fecha} onChange={setFecha} min="2020-01-01" max="2027-12-31" />
            </Field>
            <Field label="Fecha de revocación" hint="Opcional: se puede borrar.">
              <DatePicker value={fechaOpcional} onChange={setFechaOpcional} clearable />
            </Field>
            <Field label="Con error" error="La fecha es obligatoria.">
              <DatePicker value="" onChange={() => undefined} />
            </Field>
          </div>
          <Example code={'<Field label="…"><DatePicker value={iso} onChange={setIso} min="2020-01-01" clearable /></Field>'}>
            <span className="text-sm text-muted">Valor: {fecha || '—'} (ISO, como &lt;input type=&quot;date&quot;&gt;)</span>
          </Example>
        </Showcase>

        <Showcase name="Checkbox · Toggle" use="Checkbox para elegir de una lista; Toggle para una opción con efecto inmediato.">
          <Example code={'<Toggle label="…" hint="…" checked={…} onChange={…} />'}>
            <Toggle label="Solo parcelas de referencia" hint="Excluye las parcelas sin marcar como referencia." checked={toggle} onChange={(e) => setToggle(e.target.checked)} />
          </Example>
          <Example code={'<Toggle size="sm | md | lg" aria-label="…" /> · <Checkbox label="…" />'}>
            <Toggle size="sm" aria-label="Pequeño" defaultChecked />
            <Toggle aria-label="Mediano" defaultChecked />
            <Toggle size="lg" aria-label="Grande" />
            <Checkbox label="Desde 2020" defaultChecked />
            <Checkbox label="Hasta 2026" />
          </Example>
        </Showcase>
      </Group>

      <Group title="Estados y avisos">
        <Showcase name="Callout" use="Nota o aviso en línea. live lo anuncia a los lectores de pantalla al aparecer.">
          {CALLOUT_TONES.map(({ tone, text }) => (
            <Example key={tone} code={`<Callout tone="${tone}">`}>
              <Callout tone={tone} className="w-full">{text}</Callout>
            </Example>
          ))}
          <Example code={'<Callout tone="info" action={<Button …/>}>'}>
            <Callout tone="info" className="w-full" action={<Button variant="ghost" size="sm">Ver organización</Button>}>
              Con acción a la derecha.
            </Callout>
          </Example>
        </Showcase>

        <Showcase name="ErrorAlert" use="Error de carga con reintento. tone=&quot;warning&quot; si aún se muestran datos anteriores.">
          <Example code={'<ErrorAlert message="…" onRetry={reload} />'}>
            <div className="flex w-full flex-col gap-2">
              <ErrorAlert message="No se han podido cargar las parcelas." onRetry={() => undefined} />
              <ErrorAlert tone="warning" message="No se han podido actualizar los datos." onRetry={() => undefined} />
            </div>
          </Example>
        </Showcase>

        <Showcase name="EmptyState" use="Nada que mostrar. card en el lugar de una lista o página; inset dentro de una tarjeta.">
          <EmptyState
            icon={FiUsers}
            title="Aún no hay miembros"
            description="Solicita acceso a los datos de otros usuarios para empezar."
            action={<Button variant="primary" size="sm" icon={FiSend}>Solicitar acceso</Button>}
          />
          <EmptyState variant="inset" description="No hay datos de impacto para los filtros elegidos." className="h-48" />
        </Showcase>

        <Showcase name="Skeleton · Spinner" use="Carga: Skeleton reserva el sitio del contenido; Spinner, para acciones en curso.">
          <Example code={'<Skeleton className="h-24 rounded-box" /> · <Spinner />'}>
            <div className="flex w-full flex-col gap-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-24 w-full rounded-box" />
            </div>
            <Spinner size="xs" />
            <Spinner />
            <Spinner size="md" />
          </Example>
        </Showcase>
      </Group>

      <Group title="Estructura">
        <Showcase name="Breadcrumbs" use="Migas de pan; la última es la página actual.">
          <Breadcrumbs items={[{ label: 'Organizaciones', to: '/organizaciones' }, { label: 'Cooperativa Tierra de Barros', to: '/dev/ui' }, { label: 'Usuario Ejemplo 2' }]} />
        </Showcase>

        <Showcase name="Card · CardLink · Section" use="Superficies sobre el fondo de la página. Section añade título, ayuda y acciones.">
          <div className="grid grid-cols-1 gap-4 rounded-box bg-base-300 p-4 md:grid-cols-3">
            <Card>
              <span className="eyebrow">Card</span>
              <p className="text-sm">Densidad comfortable (por defecto).</p>
            </Card>
            <CardLink to="/dev/ui">
              <h3 className="text-lg font-semibold">CardLink</h3>
              <p className="text-sm text-muted">Tarjeta entera enlazada: se eleva al pasar el ratón.</p>
            </CardLink>
            <Section title="Section" hint="Densidad compact, como en estadísticas." density="compact" actions={<IconButton icon={FiSettings} label="Opciones" />}>
              <Skeleton className="h-16 rounded-box" />
            </Section>
          </div>
          <Example code={'<SectionHeader level="page" title="…" actions={…} />'}>
            <div className="w-full rounded-box bg-base-300 p-4">
              <SectionHeader level="page" title="Administro" actions={<Button variant="primary" icon={FiPlus}>Crear organización</Button>} />
            </div>
          </Example>
        </Showcase>

        <Showcase name="Tabs · TabPanel" use="Pestañas accesibles: flechas, Inicio y Fin mueven el foco. fill las estira en móvil.">
          <Tabs id={tabsId} label="Panel de la organización" items={TABS} value={tab} onChange={setTab} fill />
          <TabPanel tabsId={tabsId} value={tab} className="rounded-box bg-base-200/50 p-4 text-sm">
            Contenido de «{TABS.find((t) => t.id === tab)?.label}».
          </TabPanel>
          <Example code={'<Tabs size="sm" withPanel={false} … />'}>
            <Tabs id={`${tabsId}-sm`} label="Ranking" size="sm" items={[{ id: 'best', label: 'Menor impacto' }, { id: 'worst', label: 'Mayor impacto' }]} value="best" onChange={() => undefined} withPanel={false} />
          </Example>
        </Showcase>

        <Showcase name="Dialog · ConfirmDialog" use="Ventanas modales. ConfirmDialog gestiona el estado ocupado y el error de la acción.">
          <Example code={'<Dialog title="…" footer={…}> · <ConfirmDialog title="…" onConfirm={…} />'}>
            <Button variant="outline" onClick={() => setDialog('form')}>Abrir Dialog</Button>
            <Button variant="danger-ghost" icon={FiUserMinus} onClick={() => setDialog('confirm')}>Abrir ConfirmDialog</Button>
          </Example>
        </Showcase>
      </Group>

      {dialog === 'form' && (
        <Dialog
          title="Nueva organización"
          description="Después podrás solicitar acceso a los datos de otros usuarios."
          onClose={() => setDialog(null)}
          footer={
            <>
              <Button variant="ghost" onClick={() => setDialog(null)}>Cancelar</Button>
              <Button variant="primary" onClick={() => setDialog(null)}>Crear</Button>
            </>
          }
        >
          <div className="flex flex-col gap-4">
            <Field label="Nombre" required><Input /></Field>
            <Field label="Descripción" hint="Opcional"><Textarea rows={3} /></Field>
            <Field label="Fecha de alta"><DatePicker value={fecha} onChange={setFecha} /></Field>
          </div>
        </Dialog>
      )}
      {dialog === 'confirm' && (
        <ConfirmDialog
          title="¿Expulsar a Usuario Ejemplo 2?"
          body={<p>Se revocarán todas sus campañas y dejará de ser miembro.</p>}
          confirmLabel="Expulsar"
          onClose={() => setDialog(null)}
          onConfirm={() => Promise.reject(new Error('demo'))}
          describeError={() => 'Ejemplo de error: el diálogo sigue abierto.'}
        />
      )}
    </Page>
  );
};
