// A street map of the planned routes for one day (Leaflet, map images from OpenStreetMap:
// decision 0040). Only the map's area is sent to OpenStreetMap: names and addresses stay here.
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useRef } from 'react'
import { type PlanClient, TEAM_COLOURS, type TeamRoute } from '../lib/routePlan'
import type { Point } from '../lib/scheduleCheck'

/** Text for a tooltip, set as text so a name can never be read as markup. */
function label(text: string): HTMLElement {
  const el = document.createElement('span')
  el.textContent = text
  return el
}

export default function RouteMap({ office, clients, routes }: { office: Point | null; clients: PlanClient[]; routes: TeamRoute[] }) {
  const box = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const layer = useRef<L.LayerGroup | null>(null)

  useEffect(() => {
    if (!box.current) return
    const m = L.map(box.current, { scrollWheelZoom: false })
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '&copy; OpenStreetMap contributors' }).addTo(
      m,
    )
    layer.current = L.layerGroup().addTo(m)
    map.current = m
    return () => {
      m.remove()
      map.current = null
    }
  }, [])

  useEffect(() => {
    const m = map.current
    const g = layer.current
    if (!m || !g) return
    g.clearLayers()
    const bounds: L.LatLngExpression[] = []
    // every client in the plan, faintly, so the day's routes are seen against the rest
    for (const c of clients) {
      L.circleMarker([c.point.lat, c.point.lon], { radius: 4, color: '#4a5e63', weight: 1, fillOpacity: 0.3 })
        .bindTooltip(label(`${c.name}${c.assumed ? ' (address not found: placed at the stand-in)' : ''}`))
        .addTo(g)
      bounds.push([c.point.lat, c.point.lon])
    }
    if (office) {
      L.circleMarker([office.lat, office.lon], { radius: 9, color: '#1f3135', weight: 3, fillColor: '#f7f1e8', fillOpacity: 1 })
        .bindTooltip(label('Office'))
        .addTo(g)
      bounds.push([office.lat, office.lon])
    }
    const today: L.LatLngExpression[] = []
    for (const r of routes) {
      const colour = TEAM_COLOURS[(r.team - 1) % TEAM_COLOURS.length]
      const path: L.LatLngExpression[] = r.stops.map((s) => [s.client.point.lat, s.client.point.lon])
      L.polyline(office ? [[office.lat, office.lon], ...path, [office.lat, office.lon]] : path, {
        color: colour,
        weight: 4,
        opacity: 0.8,
      }).addTo(g)
      r.stops.forEach((s, i) => {
        L.circleMarker([s.client.point.lat, s.client.point.lon], {
          radius: 8,
          color: '#fffdf9',
          weight: 2,
          fillColor: colour,
          fillOpacity: 1,
        })
          .bindTooltip(label(`Team ${r.team}, stop ${i + 1}: ${s.client.name}`))
          .addTo(g)
      })
      today.push(...path)
    }
    const fit = today.length ? [...today, ...(office ? [[office.lat, office.lon] as L.LatLngExpression] : [])] : bounds
    if (fit.length) m.fitBounds(L.latLngBounds(fit), { padding: [30, 30], maxZoom: 13 })
    else m.setView([45.02, -74.73], 10)
  }, [office, clients, routes])

  return (
    <div
      ref={box}
      className="h-[420px] w-full rounded-xl border border-hairline print:hidden"
      role="img"
      aria-label="Map of the day's routes"
    />
  )
}
