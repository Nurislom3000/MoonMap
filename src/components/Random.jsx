import React, { useEffect, useRef, useState } from 'react'
import { landmarksData } from '../Data/LunarPoints.js'

const WorkingLunarMap = () => {
	const mapRef = useRef(null)
	const [selectedLandmark, setSelectedLandmark] = useState(null)
	const [map, setMap] = useState(null)
	const [mapReady, setMapReady] = useState(false)
	const [currentLayer, setCurrentLayer] = useState('loading...')
	const layersRef = useRef({})
	const activeLayerRef = useRef(null)

	const layerOptions = [
		'LROC WAC (Лучшее качество)',
		'LOLA Color (Цветная топография)',
		'Clementine (UV/VIS)',
		'Lunar Orbiter (Классика)',
		'Kaguya (Японская миссия)',
	]

	const handleBaseLayerChange = layerName => {
		if (!map || !layersRef.current[layerName]) return
		const nextLayer = layersRef.current[layerName]
		if (activeLayerRef.current) {
			try {
				map.removeLayer(activeLayerRef.current)
			} catch (e) {}
		}
		nextLayer.addTo(map)
		activeLayerRef.current = nextLayer
		setCurrentLayer(layerName)
	}

	const landmarks = landmarksData

	useEffect(() => {
		let isMounted = true

		const loadLeaflet = () => {
			if (typeof window !== 'undefined' && !window.L) {
				const cssLink = document.createElement('link')
				cssLink.rel = 'stylesheet'
				cssLink.href =
					'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css'
				document.head.appendChild(cssLink)

				const script = document.createElement('script')
				script.src =
					'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js'
				script.onload = () => {
					if (isMounted) {
						initializeMap()
					}
				}
				document.head.appendChild(script)
			} else if (window.L && !map && isMounted) {
				initializeMap()
			}
		}

		loadLeaflet()

		return () => {
			isMounted = false
			if (map) {
				try {
					map.remove()
					setMap(null)
					setMapReady(false)
				} catch (error) {
					console.warn('Ошибка при удалении карты:', error)
				}
			}
			// Очищаем контейнер карты
			if (mapRef.current && mapRef.current._leaflet_id) {
				delete mapRef.current._leaflet_id
			}
		}
	}, [])

	const initializeMap = () => {
		if (!mapRef.current || map) return

		// Проверяем, не инициализирована ли уже карта в этом контейнере
		if (mapRef.current._leaflet_id) {
			console.warn('Карта уже инициализирована в этом контейнере')
			return
		}

		try {
			const lunarMap = window.L.map(mapRef.current, {
				crs: window.L.CRS.EPSG4326,
				center: [0, 0],
				zoom: 2,
				minZoom: 1,
				maxZoom: 10,
				zoomControl: true,
				maxBounds: [
					[-85, -180],
					[85, 180],
				],
				maxBoundsViscosity: 1.0,
			})

			// Рабочие слои карт Луны из USGS
			const layers = {}

			// 1. LROC WAC - самый качественный слой
			const lrocWacLayer = window.L.tileLayer.wms(
				'https://planetarymaps.usgs.gov/cgi-bin/mapserv',
				{
					map: '/maps/earth/moon_simp_cyl.map',
					layers: 'LROC_WAC',
					format: 'image/png',
					transparent: false,
					attribution: '© ASU/NASA LROC WAC',
					maxZoom: 8,
					crs: window.L.CRS.EPSG4326,
				}
			)

			// 2. LROC LOLA Color Shade
			const lolaColorLayer = window.L.tileLayer.wms(
				'https://planetarymaps.usgs.gov/cgi-bin/mapserv',
				{
					map: '/maps/earth/moon_simp_cyl.map',
					layers: 'LOLA_color',
					format: 'image/png',
					transparent: false,
					attribution: '© ASU/NASA LOLA',
					maxZoom: 8,
					crs: window.L.CRS.EPSG4326,
				}
			)

			// 3. Clementine UV/VIS v2 - альтернативный
			const clementineLayer = window.L.tileLayer.wms(
				'https://planetarymaps.usgs.gov/cgi-bin/mapserv',
				{
					map: '/maps/earth/moon_simp_cyl.map',
					layers: 'uv_v2',
					format: 'image/png',
					transparent: false,
					attribution: '© USGS/NASA Clementine',
					maxZoom: 8,
					crs: window.L.CRS.EPSG4326,
				}
			)

			// 4. Lunar Orbiter - классический
			const lunarOrbiterLayer = window.L.tileLayer.wms(
				'https://planetarymaps.usgs.gov/cgi-bin/mapserv',
				{
					map: '/maps/earth/moon_simp_cyl.map',
					layers: 'LO',
					format: 'image/png',
					transparent: false,
					attribution: '© USGS/NASA Lunar Orbiter',
					maxZoom: 8,
					crs: window.L.CRS.EPSG4326,
				}
			)

			// 5. Kaguya TC Ortho
			const kaguyaLayer = window.L.tileLayer.wms(
				'https://planetarymaps.usgs.gov/cgi-bin/mapserv',
				{
					map: '/maps/earth/moon_simp_cyl.map',
					layers: 'KaguyaTC_Ortho',
					format: 'image/png',
					transparent: false,
					attribution: '© JAXA Kaguya',
					maxZoom: 8,
					crs: window.L.CRS.EPSG4326,
				}
			)

			layers['LROC WAC (Лучшее качество)'] = lrocWacLayer
			layers['LOLA Color (Цветная топография)'] = lolaColorLayer
			layers['Clementine (UV/VIS)'] = clementineLayer
			layers['Lunar Orbiter (Классика)'] = lunarOrbiterLayer
			layers['Kaguya (Японская миссия)'] = kaguyaLayer

			// Делаем слои доступными вне initializeMap
			layersRef.current = layers

			// Добавляем основной слой
			lrocWacLayer.addTo(lunarMap)
			activeLayerRef.current = lrocWacLayer
			setCurrentLayer('LROC WAC (Лучшее качество)')

			// Обработчики событий для отслеживания загрузки
			lrocWacLayer.on('loading', () => {
				console.log('🔄 Загружается LROC WAC...')
				setCurrentLayer('LROC WAC (Лучшее качество)')
			})

			lrocWacLayer.on('load', () => {
				console.log('✅ LROC WAC загружен!')
				setCurrentLayer('LROC WAC (Лучшее качество)')
				setMapReady(true)
			})

			lrocWacLayer.on('tileerror', e => {
				console.warn('❌ Ошибка загрузки тайла LROC WAC:', e)
				// Если основной слой не работает, пробуем альтернативы
				setTimeout(() => {
					if (!mapReady) {
						console.log('🔄 Пробуем LOLA Color...')
						lunarMap.removeLayer(lrocWacLayer)
						lolaColorLayer.addTo(lunarMap)
						setCurrentLayer('LOLA Color (Цветная топография)')

						setTimeout(() => {
							if (!mapReady) {
								setMapReady(true)
							}
						}, 3000)
					}
				}, 2000)
			})

			// Добавляем стили
			const style = document.createElement('style')
			style.textContent = `
      .leaflet-container {
        background: #1a1a1a !important;
      }
      .leaflet-tile {
        filter: contrast(1.05) brightness(1.02);
      }
      @keyframes pulse {
        0% { 
          box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
          transform: scale(1);
        }
        70% {
          box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
          transform: scale(1.1);
        }
        100% {
          box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
          transform: scale(1);
        }
      }
      .custom-marker {
        background: none !important;
        border: none !important;
      }
      .leaflet-control-layers {
        background: rgba(0, 0, 0, 0.8) !important;
        color: white !important;
        border: 1px solid #444 !important;
      }
      .leaflet-control-layers-toggle {
        background-color: rgba(0, 0, 0, 0.8) !important;
      }
      .leaflet-control-layers label {
        color: white !important;
      }
    `
			document.head.appendChild(style)

			// Создаем кастомные маркеры
			const createCustomIcon = () =>
				window.L.divIcon({
					className: 'custom-marker',
					html: `<div style="
        width: 16px; 
        height: 16px; 
        background: radial-gradient(circle, #ef4444, #dc2626);
        border: 2px solid white;
        border-radius: 50%;
        animation: pulse 2s infinite;
        box-shadow: 0 0 10px rgba(239, 68, 68, 0.8);
      "></div>`,
					iconSize: [20, 20],
					iconAnchor: [10, 10],
				})

			// Добавляем маркеры
			landmarks.forEach(landmark => {
				const marker = window.L.marker([landmark.lat, landmark.lng], {
					icon: createCustomIcon(),
				}).addTo(lunarMap)

				marker.on('click', () => {
					setSelectedLandmark(landmark)
					const targetZoom = Math.max(lunarMap.getZoom(), 5)
					lunarMap.setView([landmark.lat, landmark.lng], targetZoom, {
						animate: true,
						duration: 1,
					})
				})
			})

			// Убираем стандартный контрол слоев; используем свой переключатель

			// Добавляем координаты при наведении
			const coordsDiv = window.L.DomUtil.create('div', 'coord-display')
			coordsDiv.style.cssText = `
      position: absolute;
      bottom: 10px;
      left: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 5px 10px;
      border-radius: 3px;
      font-size: 12px;
      z-index: 1000;
      pointer-events: none;
    `
			lunarMap.getContainer().appendChild(coordsDiv)

			lunarMap.on('mousemove', e => {
				const lat = e.latlng.lat.toFixed(3)
				const lng = e.latlng.lng.toFixed(3)
				coordsDiv.innerHTML = `Координаты: ${lat}°, ${lng}°`
			})

			setMap(lunarMap)

			// Принудительная активация через 5 секунд
			setTimeout(() => {
				if (!mapReady) {
					console.log('⏰ Принудительная активация карты')
					setMapReady(true)
				}
			}, 5000)
		} catch (error) {
			console.error('Ошибка при инициализации карты:', error)
			setMapReady(false)
		}
	}

	const handleLandmarkSelect = landmark => {
		if (map) {
			const targetZoom = Math.max(map.getZoom(), 6)
			map.setView([landmark.lat, landmark.lng], targetZoom, {
				animate: true,
				duration: 1.2,
			})
			setSelectedLandmark(landmark)
		}
	}

	return (
		<div>
			<div className='w-full h-screen bg-gray-900 relative'>
				{/* Индикатор загрузки */}
				{!mapReady && (
					<div className='absolute inset-0 z-[2000] bg-gray-900 bg-opacity-95 flex items-center justify-center'>
						<div className='text-center flex flex-col items-center'>
							<div className='relative w-24 h-24 mb-6 '>
								<div className='absolute inset-0 rounded-full border-4 border-gray-600'></div>
								<div className='absolute inset-0 rounded-full border-4 border-blue-400 border-t-transparent animate-spin'></div>
								<div className='absolute inset-2 bg-gradient-radial from-gray-200 to-gray-500 rounded-full flex items-center justify-center text-xl'>
									🌙
								</div>
							</div>
							<h2 className='text-xl font-bold text-white mb-2'>
								Загрузка карты Луны USGS
							</h2>
							<p className='text-blue-300 mb-2'>{currentLayer}</p>
							<div className='flex items-center justify-center space-x-2 text-sm text-gray-400'>
								<div className='w-2 h-2 bg-blue-400 rounded-full animate-ping'></div>
								<span>Подключение к серверам NASA/USGS...</span>
							</div>
						</div>
					</div>
				)}

				{/* Переключатель режима просмотра */}
				<div className='absolute top-4 left-4 z-[2000] bg-black bg-opacity-90 backdrop-blur-sm rounded-lg p-3 border border-blue-500 w-[300px]'>
					<label className='block text-xs text-gray-300 mb-2'>
						Режим карты
					</label>
					<select
						className='w-full bg-gray-800 text-white text-sm p-2 rounded border border-gray-600 focus:outline-none focus:border-blue-400'
						value={currentLayer}
						onChange={e => handleBaseLayerChange(e.target.value)}
					>
						{layerOptions.map(opt => (
							<option key={opt} value={opt}>
								{opt}
							</option>
						))}
					</select>
					{!mapReady && (
						<div className='text-xs text-blue-300 mt-2'>
							📡 Загрузка данных...
						</div>
					)}
				</div>

				{/* Панель локаций */}
				<div className='absolute top-4 right-4 z-[2000] bg-black bg-opacity-90 backdrop-blur-sm rounded-lg p-4 max-w-sm border border-blue-500'>
					<h3 className='text-lg font-bold text-white mb-3'>
						🎯 Исторические места
					</h3>
					<div className='max-h-80 overflow-y-auto space-y-2'>
						{landmarks.map(landmark => (
							<button
								key={landmark.id}
								onClick={() => handleLandmarkSelect(landmark)}
								className='w-full text-left p-3 rounded-lg bg-gray-800 bg-opacity-60 hover:bg-blue-800 hover:bg-opacity-80 text-white text-sm transition-all duration-200 hover:scale-105 border border-gray-600 hover:border-blue-400'
							>
								<div className='font-medium'>{landmark.title}</div>
								<div className='text-xs text-gray-300 mt-1'>
									{landmark.lat > 0 ? 'N' : 'S'}{' '}
									{Math.abs(landmark.lat).toFixed(1)}°,{' '}
									{landmark.lng > 0 ? 'E' : 'W'}{' '}
									{Math.abs(landmark.lng).toFixed(1)}°
								</div>
							</button>
						))}
					</div>
				</div>

				{/* Информационная панель */}
				{selectedLandmark && (
					<div className='absolute bottom-4 left-4 z-[2000] bg-black bg-opacity-95 backdrop-blur-lg rounded-xl p-6 max-w-lg shadow-2xl border border-blue-500'>
						<button
							onClick={() => setSelectedLandmark(null)}
							className='absolute top-3 right-4 text-white text-xl hover:text-blue-400 transition-colors'
						>
							×
						</button>

						<h3 className='text-xl font-bold text-blue-400 mb-3 pr-8'>
							{selectedLandmark.title}
						</h3>

						<p className='text-gray-200 mb-4 leading-relaxed text-sm'>
							{selectedLandmark.description}
						</p>

						<div className='text-sm text-gray-300 border-t border-gray-600 pt-3'>
							<div className='mb-3 font-medium'>
								📍 Координаты: {selectedLandmark.lat}°, {selectedLandmark.lng}°
							</div>
							<pre className='whitespace-pre-wrap font-mono text-xs bg-gray-800 bg-opacity-70 p-3 rounded'>
								{selectedLandmark.details}
							</pre>
						</div>
					</div>
				)}

				{/* Карта */}
				<div ref={mapRef} className='w-full h-full z-0' />

				{/* Инструкции */}
				<div className='absolute bottom-4 right-4 z-[2000] bg-black bg-opacity-90 backdrop-blur-sm rounded-lg p-4 max-w-xs border border-blue-500'>
					<h4 className='text-white font-medium mb-2'>🚀 Управление</h4>
					<div className='text-sm text-gray-300 space-y-1'>
						<div>🖱️ Перетаскивание - движение по карте</div>
						<div>🔍 Колесо мыши - приближение/отдаление</div>
						<div>📍 Клик по точкам - подробная информация</div>
						<div>🗂️ Панель слоев - левый верхний угол карты</div>
						{mapReady && (
							<div className='text-blue-400 text-xs mt-2'>
								✅ Реальные спутниковые снимки NASA/USGS
							</div>
						)}
					</div>
					<div className='text-xs text-gray-500 mt-3 pt-2 border-t border-gray-600'>
						Источники данных:
						<br />
						• LRO WAC Camera
						<br />
						• LOLA Altimeter
						<br />
						• Clementine UV/VIS
						<br />
						• Lunar Orbiter
						<br />• Kaguya TC
					</div>
				</div>
			</div>
		</div>
	)
}

export default WorkingLunarMap
