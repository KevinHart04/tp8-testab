# Informe del Experimento A/B — Taller Norte

## 1. Qué ve una persona asignada a B

Una persona asignada a la variante **B (Tratamiento)** ve:

- **Titular**: "El curso empieza el 14 de abril. El cupo, no."
- **Llamado a la acción (CTA)**: "Reservar mi lugar"
- **Title (meta)**: "Abril abre cupos: cursos de oficio en grupos de 12" (50 caracteres)
- **Description (meta)**: "El 14 de abril empiezan grupos de doce. En la cohorte anterior, ocho de cada diez consiguieron trabajo en el rubro antes de los noventa días." (141 caracteres)

**Lo que NO cambió (oferta idéntica en ambas variantes):**
- Inicio: 14 de abril
- Duración: 8 semanas
- Cupo: 12 personas
- Oficios: carpintería, electricidad y cocina

---

## 2. Qué debería ver un crawler

Un crawler (bot de buscador) **no conserva cookies** entre visitas. Si cada visita sin cookie sorteara una variante al azar (o alternara), el buscador indexaría un texto inestable: a veces vería el titular A, a veces el B, a veces una mezcla.

**La solución implementada:**
- El crawler recibe siempre la **variante A (Control)** como fallback cuando no hay cookie de visitante.
- Los metadatos (title, description) y el contenido principal se renderizan en el **HTML de la primera respuesta del servidor** (SSR), no con JavaScript del cliente.
- El **canonical** apunta siempre a `/practica` sin query string.
- Esto garantiza que el buscador indexe **una sola versión estable** de la página, evitando contenido duplicado o fluctuante.

> **Nota sobre cloaking**: Mostrar siempre la variante A al crawler **no es cloaking**. Cloaking sería servir contenido distinto al bot y a la persona *para manipular el ranking* (ej.: keywords de relleno para el bot, oferta real para el usuario). Aquí se sirve la misma oferta, mismo canonical, misma URL; solo se fija una variante de referencia para que el índice sea estable. La persona, en cambio, recibe su variante asignada por cookie.

---

## 3. Por qué el canonical no cambia

Las dos variantes **son la misma página**: misma oferta, misma URL, mismo propósito. El experimento cambia solo el *mensaje* (copy), no el *producto*.

- Si se publicaran dos URLs (`/variante-a` y `/variante-b`) o se canonizara `?variant=b`, se crearían **páginas duplicadas** en el índice del buscador.
- Eso diluye la autoridad de la página (link equity, señales de usuario) entre dos URLs y confunde a los algoritmos de ranking.
- El canonical único (`/practica`) consolida todas las señales en **una sola URL indexable**, que es la práctica SEO correcta para tests A/B de contenido.

---

## Función de hash estable utilizada

**Algoritmo**: FNV-1a de 32 bits (Fowler–Noll–Vo), implementado en `lib/experiment.ts`.

```typescript
function stableHash(visitorId: string): 'A' | 'B' {
  let hash = 0x811c9dc5; // FNV offset basis
  for (let i = 0; i < visitorId.length; i++) {
    hash ^= visitorId.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193); // FNV prime
  }
  return (hash >>> 0) % 2 === 0 ? 'A' : 'B';
}
```

**Propiedades**:
- Determinística: mismo input → mismo output siempre.
- Distribución pareja: aproximadamente 50/50 entre A y B.
- Sin estado: no usa `Math.random()`, fecha, ni almacenamiento externo.
- Rápida: O(n) donde n = longitud del ID.

---

## Prueba con `lab-visitor-demo-01`

| Ejecución | Variante resultante |
|-----------|---------------------|
| 1         | B                   |
| 2         | B                   |
| 3         | B                   |

El identificador `lab-visitor-demo-01` **siempre cae en la variante B** con la función FNV-1a implementada. Repetir el hash n veces produce idéntico resultado, cumpliendo el requisito de asignación estable.