import { MapContainer, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import Router from './router'

export default function App() {
	return (
		<div style={{ height: '100vh', width: '100%' }}>
			<Router />
		</div>
	)
}
