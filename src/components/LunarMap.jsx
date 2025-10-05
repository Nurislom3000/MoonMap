import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { lunarData } from '../Data/LunarPoints'

// Данные ориентиров (заглушка для демонстрации)
const landmarksData = lunarData

const WorkingLunarMap = () => {
	const navigate = useNavigate()
	const location = useLocation()
	const mapRef = useRef(null)
	const [selectedLandmark, setSelectedLandmark] = useState(null)
	const [map, setMap] = useState(null)
	const [mapReady, setMapReady] = useState(false)
	const [currentLayer, setCurrentLayer] = useState('loading...')
	const layersRef = useRef({})
	const activeLayerRef = useRef(null)

	// Состояния для клика по карте
	const [clickedPoint, setClickedPoint] = useState(null)
	const [clickedCoordinates, setClickedCoordinates] = useState(null)
	const clickMarkerRef = useRef(null)

	// Состояния для игрового режима
	const [gameMode, setGameMode] = useState(false)
	const [gameTarget, setGameTarget] = useState(null)
	const [gameResult, setGameResult] = useState(null)
	const [showTargetSelection, setShowTargetSelection] = useState(false)
	const redMarkersRef = useRef([])
	const targetMarkerRef = useRef(null)
	const gameModeRef = useRef(false)
	const gameTargetRef = useRef(null)
	const gameLineRef = useRef(null)

	const layerOptions = [
		'LROC WAC (Best Quality)',
		'LOLA Color (Color Topography)',
		'Clementine (UV/VIS)',
		'Lunar Orbiter (Classic)',
		'Kaguya (Japanese Mission)',
	]

	// Layer changing handler
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

	// Функция для вычисления расстояния между точками (в км)
	const calculateDistance = (lat1, lon1, lat2, lon2) => {
		const R = 1737.4 // радиус Луны в км
		const dLat = ((lat2 - lat1) * Math.PI) / 180
		const dLon = ((lon2 - lon1) * Math.PI) / 180
		const a =
			Math.sin(dLat / 2) * Math.sin(dLat / 2) +
			Math.cos((lat1 * Math.PI) / 180) *
				Math.cos((lat2 * Math.PI) / 180) *
				Math.sin(dLon / 2) *
				Math.sin(dLon / 2)
		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
		return R * c
	}

	// Начать игру
	const startGame = () => {
		setShowTargetSelection(true)
	}

	// Выбрать цель для игры
	const selectGameTarget = landmark => {
		setGameTarget(landmark)
		setGameMode(true)
		gameTargetRef.current = landmark
		gameModeRef.current = true
		setShowTargetSelection(false)
		setGameResult(null)
		setClickedCoordinates(null)
		setClickedPoint(null)

		// Скрыть все красные маркеры
		redMarkersRef.current.forEach(marker => {
			if (map) {
				map.removeLayer(marker)
			}
		})

		// Удалить синий маркер если есть
		if (clickMarkerRef.current && map) {
			map.removeLayer(clickMarkerRef.current)
			clickMarkerRef.current = null
		}
	}

	// Выйти из игрового режима
	const exitGameMode = () => {
		// Удалить линию если есть
		if (gameLineRef.current && map) {
			try {
				map.removeLayer(gameLineRef.current)
				gameLineRef.current = null
			} catch (e) {
				console.log(e)
			}
		}

		setGameMode(false)
		setGameTarget(null)
		gameModeRef.current = false
		gameTargetRef.current = null
		setGameResult(null)
		setClickedCoordinates(null)
		setClickedPoint(null)

		// Показать обратно красные маркеры
		redMarkersRef.current.forEach(marker => {
			if (map) {
				marker.addTo(map)
			}
		})

		// Удалить маркеры игры
		if (clickMarkerRef.current && map) {
			map.removeLayer(clickMarkerRef.current)
			clickMarkerRef.current = null
		}
		if (targetMarkerRef.current && map) {
			map.removeLayer(targetMarkerRef.current)
			targetMarkerRef.current = null
		}
	}

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
			if (mapRef.current && mapRef.current._leaflet_id) {
				delete mapRef.current._leaflet_id
			}
		}
	}, [])

	const initializeMap = () => {
		if (!mapRef.current || map) return

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
				zoomControl: false,
				maxBounds: [
					[-85, -180],
					[85, 180],
				],
				maxBoundsViscosity: 1.0,
			})

			const layers = {}

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

			layers['LROC WAC (Best Quality)'] = lrocWacLayer
			layers['LOLA Color (Color Topography)'] = lolaColorLayer
			layers['Clementine (UV/VIS)'] = clementineLayer
			layers['Lunar Orbiter (Classic)'] = lunarOrbiterLayer
			layers['Kaguya (Japanese Mission)'] = kaguyaLayer

			layersRef.current = layers

			lrocWacLayer.addTo(lunarMap)
			activeLayerRef.current = lrocWacLayer
			setCurrentLayer('LROC WAC (Best Quality)')

			// Создаем кастомные маркеры (точки на карте)
			const createCustomIcon = () =>
				window.L.divIcon({
					className: 'custom-marker',
					html: `<div style="
        width: 14px; 
        height: 14px; 
        background: #dc2626;
        border: 2px solid #ffffff;
        border-radius: 50%;
        box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.3);
      "></div>`,
					iconSize: [18, 18],
					iconAnchor: [9, 9],
				})

			// Добавляем маркеры
			const markers = []
			landmarks.forEach(landmark => {
				const marker = window.L.marker([landmark.lat, landmark.lng], {
					icon: createCustomIcon(),
				}).addTo(lunarMap)

				marker.on('click', e => {
					window.L.DomEvent.stopPropagation(e)
					setSelectedLandmark(landmark)
					const targetZoom = Math.max(lunarMap.getZoom(), 5)
					lunarMap.setView([landmark.lat, landmark.lng], targetZoom, {
						animate: true,
						duration: 1,
					})
				})

				markers.push(marker)
			})

			redMarkersRef.current = markers

			// Обработчик клика по карте
			lunarMap.on('click', e => {
				const { lat, lng } = e.latlng

				console.log('Map clicked!', {
					lat,
					lng,
					gameMode: gameModeRef.current,
					gameTarget: gameTargetRef.current,
				})

				// В игровом режиме
				if (gameModeRef.current && gameTargetRef.current) {
					console.log('Game mode active, processing...')

					// Удаляем предыдущую линию если есть
					if (gameLineRef.current) {
						try {
							lunarMap.removeLayer(gameLineRef.current)
							gameLineRef.current = null
						} catch (e) {
							console.log('Error removing line:', e)
						}
					}

					// Удаляем предыдущий синий маркер, если есть
					if (clickMarkerRef.current) {
						lunarMap.removeLayer(clickMarkerRef.current)
					}

					// Удаляем предыдущий зелёный маркер, если есть
					if (targetMarkerRef.current) {
						lunarMap.removeLayer(targetMarkerRef.current)
					}

					// Создаем синий маркер (догадка игрока)
					const blueIcon = window.L.divIcon({
						className: 'custom-marker',
						html: `<div style="
							width: 16px; 
							height: 16px; 
							background: #3b82f6;
							border: 2px solid #ffffff;
							border-radius: 50%;
							box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.4);
						"></div>`,
						iconSize: [20, 20],
						iconAnchor: [10, 10],
					})

					// Добавляем синий маркер
					const newMarker = window.L.marker([lat, lng], {
						icon: blueIcon,
					}).addTo(lunarMap)

					clickMarkerRef.current = newMarker
					setClickedCoordinates({ lat, lng })
					setClickedPoint({ lat, lng })

					// Вычисляем расстояние
					const distance = calculateDistance(
						gameTargetRef.current.lat,
						gameTargetRef.current.lng,
						lat,
						lng
					)

					console.log('Distance calculated:', distance)

					// Показываем настоящую точку (зелёная)
					const greenIcon = window.L.divIcon({
						className: 'custom-marker',
						html: `<div style="
							width: 18px; 
							height: 18px; 
							background: #10b981;
							border: 2px solid #ffffff;
							border-radius: 50%;
							box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.4);
						"></div>`,
						iconSize: [22, 22],
						iconAnchor: [11, 11],
					})

					const targetMarker = window.L.marker(
						[gameTargetRef.current.lat, gameTargetRef.current.lng],
						{
							icon: greenIcon,
						}
					).addTo(lunarMap)

					targetMarkerRef.current = targetMarker

					console.log(
						'Green marker added at:',
						gameTargetRef.current.lat,
						gameTargetRef.current.lng
					)

					// Рисуем линию между точками
					const line = window.L.polyline(
						[
							[lat, lng],
							[gameTargetRef.current.lat, gameTargetRef.current.lng],
						],
						{
							color: '#f59e0b',
							weight: 3,
							opacity: 0.8,
							dashArray: '10, 10',
						}
					).addTo(lunarMap)

					gameLineRef.current = line

					console.log('Line added')

					// Сохраняем результат
					let accuracy = 'Excellent!'
					let emoji = '🎯'
					let color = 'from-green-600/90 to-emerald-600/90'

					if (distance > 500) {
						accuracy = 'Very far...'
						emoji = '🌍'
						color = 'from-red-600/90 to-rose-600/90'
					} else if (distance > 200) {
						accuracy = 'Too far'
						emoji = '❌'
						color = 'from-orange-600/90 to-red-600/90'
					} else if (distance > 100) {
						accuracy = 'Far away'
						emoji = '📍'
						color = 'from-yellow-600/90 to-orange-600/90'
					} else if (distance > 50) {
						accuracy = 'Not bad'
						emoji = '👍'
						color = 'from-lime-600/90 to-yellow-600/90'
					} else if (distance > 20) {
						accuracy = 'Good!'
						emoji = '✨'
						color = 'from-green-600/90 to-lime-600/90'
					} else if (distance > 5) {
						accuracy = 'Great!'
						emoji = '🌟'
						color = 'from-green-600/90 to-emerald-600/90'
					} else {
						accuracy = 'Perfect!'
						emoji = '🎯'
						color = 'from-emerald-600/90 to-teal-600/90'
					}

					setGameResult({
						distance: distance.toFixed(2),
						accuracy,
						emoji,
						color,
					})

					console.log('Game result set:', { distance, accuracy })

					// Центрируем карту чтобы показать обе точки
					const bounds = window.L.latLngBounds([
						[lat, lng],
						[gameTargetRef.current.lat, gameTargetRef.current.lng],
					])
					lunarMap.fitBounds(bounds, { padding: [100, 100] })
				} else {
					// Обычный режим
					console.log('Normal mode')
					// Удаляем предыдущий синий маркер, если есть
					if (clickMarkerRef.current) {
						lunarMap.removeLayer(clickMarkerRef.current)
					}

					// Создаем синий маркер
					const blueIcon = window.L.divIcon({
						className: 'custom-marker',
						html: `<div style="
							width: 16px; 
							height: 16px; 
							background: #3b82f6;
							border: 2px solid #ffffff;
							border-radius: 50%;
							box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.4);
						"></div>`,
						iconSize: [20, 20],
						iconAnchor: [10, 10],
					})

					// Добавляем новый синий маркер
					const newMarker = window.L.marker([lat, lng], {
						icon: blueIcon,
					}).addTo(lunarMap)

					clickMarkerRef.current = newMarker
					setClickedCoordinates({ lat, lng })
					setClickedPoint({ lat, lng })
					console.log('Clicked coordinates:', { lat, lng })
				}
			})

			setMap(lunarMap)

			lrocWacLayer.on('load', () => {
				setMapReady(true)
			})

			// setTimeout(() => {
			// 	if (!mapReady) {
			// 		setMapReady(true)
			// 	}
			// }, 6000)
		} catch (error) {
			console.error('Ошибка при инициализации карты:', error)
			setMapReady(false)
		}
	}

	const handleLandmarkSelect = landmark => {
		if (map && !gameMode) {
			const targetZoom = Math.max(map.getZoom(), 6)
			map.setView([landmark.lat, landmark.lng], targetZoom, {
				animate: true,
				duration: 1.2,
			})
			setSelectedLandmark(landmark)
		}
	}

	useEffect(() => {
		// Проверяем, нужно ли включить игровой режим при загрузке
		const params = new URLSearchParams(location.search)
		if (params.get('game') === '1') {
			setShowTargetSelection(true)
		}
	}, [location.search])

	return (
		<div className='w-full h-screen bg-gray-900 relative overflow-hidden'>
			{/* Go Back Button */}
			<button
				onClick={() => {
					navigate('/')
				}}
				className='absolute top-6 left-6 z-50 bg-white/10 backdrop-blur-xl text-white px-4 py-2 rounded-[20px] border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all duration-300 flex items-center gap-2 shadow-2xl'
			>
				<svg
					className='w-4 h-4'
					fill='none'
					stroke='currentColor'
					viewBox='0 0 24 24'
				>
					<path
						strokeLinecap='round'
						strokeLinejoin='round'
						strokeWidth={2}
						d='M10 19l-7-7m0 0l7-7m-7 7h18'
					/>
				</svg>
				Go back
			</button>

			{/* Game Mode Button */}
			{!gameMode && (
				<button
					onClick={startGame}
					className='absolute top-6 left-36 z-50 bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-xl text-white px-5 py-2 rounded-[20px] border border-white/20 hover:from-purple-500/30 hover:to-pink-500/30 hover:border-white/30 transition-all duration-300 flex items-center gap-2 font-semibold shadow-2xl'
				>
					<svg
						className='w-5 h-5'
						fill='none'
						stroke='currentColor'
						viewBox='0 0 24 24'
					>
						<path
							strokeLinecap='round'
							strokeLinejoin='round'
							strokeWidth={2}
							d='M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z'
						/>
						<path
							strokeLinecap='round'
							strokeLinejoin='round'
							strokeWidth={2}
							d='M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
						/>
					</svg>
					Game Mode
				</button>
			)}

			{/* Exit Game Button */}
			{gameMode && (
				<button
					onClick={exitGameMode}
					className='absolute top-6 left-36 z-50 bg-red-500/20 backdrop-blur-xl text-white px-5 py-2 rounded-[20px] border border-white/20 hover:bg-red-500/30 hover:border-white/30 transition-all duration-300 flex items-center gap-2 font-semibold shadow-2xl'
				>
					<svg
						className='w-5 h-5'
						fill='none'
						stroke='currentColor'
						viewBox='0 0 24 24'
					>
						<path
							strokeLinecap='round'
							strokeLinejoin='round'
							strokeWidth={2}
							d='M6 18L18 6M6 6l12 12'
						/>
					</svg>
					Exit Game
				</button>
			)}

			{/* Target Selection Modal */}
			{showTargetSelection && (
				<div className='absolute inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center'>
					<div className='bg-gray-800 rounded-3xl p-8 max-w-2xl w-full mx-4 border border-blue-500/30'>
						<h2 className='text-3xl font-bold text-white mb-2 text-center'>
							Select Your Target
						</h2>
						<p className='text-gray-400 text-center mb-6'>
							Choose a location to find on the Moon
						</p>

						<div className='grid grid-cols-1 gap-3 max-h-96 overflow-y-auto'>
							{landmarks.map(landmark => (
								<button
									key={landmark.id}
									onClick={() => selectGameTarget(landmark)}
									className='text-left p-5 rounded-2xl bg-gradient-to-r from-gray-700/50 to-gray-600/50 hover:from-purple-600/50 hover:to-pink-600/50 text-white transition-all duration-200 border border-gray-600/30 hover:border-purple-400/50 group'
								>
									<div className='flex items-center gap-4'>
										<div className='w-4 h-4 bg-purple-500 rounded-full border-2 border-white flex-shrink-0 group-hover:animate-pulse'></div>
										<div className='flex-grow'>
											<div className='font-bold text-lg text-white group-hover:text-purple-200 transition-colors'>
												{landmark.title}
											</div>
											<div className='text-sm text-gray-400 mt-1'>
												{landmark.description}
											</div>
										</div>
									</div>
								</button>
							))}
						</div>

						<button
							onClick={() => setShowTargetSelection(false)}
							className='mt-6 w-full bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-xl transition-all duration-200'
						>
							Cancel
						</button>
					</div>
				</div>
			)}

			{/* Game Status Panel */}
			{gameMode && gameTarget && !gameResult && (
				<div className='absolute top-6 left-1/2 transform -translate-x-1/2 z-50 bg-gradient-to-r from-purple-600/90 to-pink-600/90 backdrop-blur-sm rounded-2xl px-6 py-4 border border-purple-400/30'>
					<div className='text-center'>
						<div className='text-white font-bold text-lg mb-1'>
							🎯 Find: {gameTarget.title}
						</div>
						<div className='text-purple-200 text-sm'>
							Click on the map to place your guess
						</div>
					</div>
				</div>
			)}

			{/* Game Result Panel */}
			{gameResult && (
				<div
					className={`absolute top-6 left-1/2 transform -translate-x-1/2 z-50 bg-gradient-to-r ${gameResult.color} backdrop-blur-sm rounded-2xl px-8 py-6 border border-white/30 shadow-2xl`}
				>
					<div className='text-center'>
						<div className='text-5xl mb-3'>{gameResult.emoji}</div>
						<div className='text-white font-bold text-2xl mb-2'>
							{gameResult.accuracy}
						</div>
						<div className='text-white/90 text-lg mb-1'>
							Distance:{' '}
							<span className='font-bold'>{gameResult.distance} km</span>
						</div>
						<div className='text-white/70 text-sm mb-4'>
							from {gameTarget.title}
						</div>
						<div className='flex gap-3 justify-center'>
							<button
								onClick={() => {
									// Удалить старую линию
									if (gameLineRef.current && map) {
										try {
											map.removeLayer(gameLineRef.current)
											gameLineRef.current = null
										} catch (e) {}
									}
									// Удалить маркеры
									if (clickMarkerRef.current && map) {
										map.removeLayer(clickMarkerRef.current)
										clickMarkerRef.current = null
									}
									if (targetMarkerRef.current && map) {
										map.removeLayer(targetMarkerRef.current)
										targetMarkerRef.current = null
									}
									// Выбрать новую случайную цель
									selectGameTarget(
										landmarks[Math.floor(Math.random() * landmarks.length)]
									)
								}}
								className='bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl transition-all duration-200 font-medium'
							>
								🔄 Play Again
							</button>
							<button
								onClick={exitGameMode}
								className='bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl transition-all duration-200 font-medium'
							>
								Exit
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Map Mode Panel */}
			{!gameMode && (
				<div className='absolute opacity-95 top-20 left-6 z-50 w-80'>
					{/* Liquid Glass Container with Glossy Effect */}
					<div className='relative rounded-3xl overflow-hidden backdrop-blur-2xl bg-gradient-to-br from-blue-700/40 via-gray-950/80 to-blue-900/50 border border-blue-400/40 shadow-[0_0_40px_rgba(0,0,0,0.8),0_20px_60px_rgba(0,0,0,0.5)] p-4'>
						{/* Top glossy highlight */}
						<div className='absolute inset-0 bg-gradient-to-b from-blue-400/15 via-transparent to-transparent pointer-events-none'></div>

						{/* Animated gradient overlay */}
						<div className='absolute inset-0 bg-gradient-to-tr from-blue-500/10 via-transparent to-cyan-500/10 pointer-events-none'></div>

						{/* Content */}
						<div className='relative'>
							<label className='block text-sm text-gray-300 mb-3 font-medium'>
								Map Mode
							</label>
							<div className='relative'>
								<select
									className='w-full bg-gray-700/50 text-white text-sm p-3 rounded-xl border border-gray-600/50 focus:outline-none focus:border-blue-400 appearance-none pr-10'
									value={currentLayer}
									onChange={e => handleBaseLayerChange(e.target.value)}
								>
									{layerOptions.map(opt => (
										<option key={opt} value={opt}>
											{opt}
										</option>
									))}
								</select>
								<svg
									className='absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none'
									fill='none'
									stroke='currentColor'
									viewBox='0 0 24 24'
								>
									<path
										strokeLinecap='round'
										strokeLinejoin='round'
										strokeWidth={2}
										d='M19 9l-7 7-7-7'
									/>
								</svg>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Historic Sites Panel */}
			{!gameMode && (
				<div className='absolute top-6 opacity-95 right-6 z-50 w-80'>
					{/* Liquid Glass Container with Glossy Effect */}
					<div className='relative rounded-3xl overflow-hidden backdrop-blur-2xl bg-gradient-to-br from-blue-700/40 via-gray-950/80 to-blue-900/50 border border-blue-400/40 shadow-[0_0_40px_rgba(0,0,0,0.8),0_20px_60px_rgba(0,0,0,0.5)]'>
						{/* Top glossy highlight - very subtle and smooth */}
						<div className='absolute inset-0 bg-gradient-to-b from-blue-400/4 via-blue-400/2 via-blue-400/1 to-transparent pointer-events-none'></div>

						{/* Animated gradient overlay - softer */}
						<div className='absolute inset-0 bg-gradient-to-tr from-blue-500/3 via-blue-500/1 via-transparent to-cyan-500/3 pointer-events-none'></div>

						{/* Content */}
						<div className='relative'>
							<div className='p-5 pb-4 border-b border-blue-500/20'>
								<h3 className='text-lg font-bold text-white mb-4 flex items-center gap-2 drop-shadow-lg'>
									HISTORIC SITES
								</h3>
							</div>

							<div className='max-h-96 overflow-y-auto px-5 pb-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]'>
								<div className='space-y-3 pt-3'>
									{landmarks.map(landmark => (
										<button
											key={landmark.id}
											onClick={() => handleLandmarkSelect(landmark)}
											className='w-full text-left p-4 rounded-2xl backdrop-blur-xl bg-gradient-to-r from-blue-600/20 via-gray-800/40 to-blue-700/25 hover:from-blue-500/30 hover:via-gray-700/50 hover:to-blue-600/35 text-white text-sm transition-all duration-300 border border-blue-400/25 hover:border-blue-300/60 group shadow-lg hover:shadow-blue-500/30 hover:shadow-2xl hover:scale-[1.02] relative overflow-hidden'
										>
											{/* Button glossy overlay */}
											<div className='absolute inset-0 bg-gradient-to-br from-blue-300/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none'></div>

											<div className='flex items-center gap-3 relative z-10'>
												<div className='w-3 h-3 bg-red-500 rounded-full border-2 border-white flex-shrink-0 shadow-lg shadow-red-500/50'></div>
												<div className='flex-grow min-w-0'>
													<div className='font-semibold text-white group-hover:text-blue-200 transition-colors truncate drop-shadow-md'>
														{landmark.title}
													</div>
													<div className='text-xs text-gray-400 mt-1'>
														{landmark.lat > 0 ? 'N' : 'S'}{' '}
														{Math.abs(landmark.lat).toFixed(1)}°,{' '}
														{landmark.lng > 0 ? 'E' : 'W'}{' '}
														{Math.abs(landmark.lng).toFixed(1)}°
													</div>
												</div>
											</div>
										</button>
									))}
								</div>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Clicked Coordinates (only in normal mode) */}
			{clickedCoordinates && !gameMode && (
				<div className='absolute top-6 left-1/2 transform -translate-x-1/2 z-50 bg-blue-600/90 backdrop-blur-sm rounded-2xl px-6 py-4 border border-blue-400/30'>
					<div className='flex items-center gap-3'>
						<div className='w-3 h-3 bg-white rounded-full animate-pulse'></div>
						<div className='text-white font-medium'>
							Clicked Point: {clickedCoordinates.lat.toFixed(4)}°,{' '}
							{clickedCoordinates.lng.toFixed(4)}°
						</div>
						<button
							onClick={() => {
								setClickedCoordinates(null)
								setClickedPoint(null)
								if (clickMarkerRef.current && map) {
									map.removeLayer(clickMarkerRef.current)
									clickMarkerRef.current = null
								}
							}}
							className='text-white/80 hover:text-white text-lg ml-2'
						>
							×
						</button>
					</div>
				</div>
			)}

			{/* Information Panel */}
			{selectedLandmark && !gameMode && (
				<div className='absolute opacity-98 bottom-6 left-6 z-50 max-w-md'>
					{/* Liquid Glass Container with Glossy Effect */}
					<div className='relative rounded-3xl overflow-hidden backdrop-blur-2xl bg-gradient-to-br from-blue-700/40 via-gray-950/80 to-blue-900/50 border border-blue-400/40 shadow-[0_0_40px_rgba(0,0,0,0.8),0_20px_60px_rgba(0,0,0,0.5)] p-6'>
						{/* Top glossy highlight - very subtle and smooth */}
						<div className='absolute inset-0 bg-gradient-to-b from-blue-400/4 via-blue-400/2 via-blue-400/1 to-transparent pointer-events-none'></div>

						{/* Animated gradient overlay - softer */}
						<div className='absolute inset-0 bg-gradient-to-tr from-blue-500/3 via-blue-500/1 via-transparent to-cyan-500/3 pointer-events-none'></div>

						{/* Content */}
						<div className='relative'>
							<button
								onClick={() => setSelectedLandmark(null)}
								className='absolute top-0 right-0 text-gray-400 hover:text-white text-xl transition-colors'
							>
								×
							</button>

							<h3 className='text-xl font-bold text-white mb-3 pr-8'>
								{selectedLandmark.title}
							</h3>

							<p className='text-gray-300 mb-4 text-sm leading-relaxed'>
								{selectedLandmark.description}
							</p>

							<div className='space-y-2'>
								<div className='flex items-center gap-2 text-sm'>
									<svg
										className='w-4 h-4 text-red-500'
										fill='currentColor'
										viewBox='0 0 20 20'
									>
										<path
											fillRule='evenodd'
											d='M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z'
											clipRule='evenodd'
										/>
									</svg>
									<span className='text-red-400 font-medium'>
										Coordinates: {selectedLandmark.lat}°, {selectedLandmark.lng}
										°
									</span>
								</div>
							</div>

							<div className='mt-4 pt-4 border-t border-gray-600/50'>
								<pre className='text-xs text-gray-300 font-mono whitespace-pre-wrap bg-gray-700/30 p-3 rounded-lg'>
									{selectedLandmark.details}
								</pre>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Controls Panel */}
			<div className='absolute bottom-6 opacity-95 right-6 z-50 w-64'>
				{/* Liquid Glass Container with Glossy Effect */}
				<div className='relative rounded-3xl overflow-hidden backdrop-blur-2xl bg-gradient-to-br from-blue-700/40 via-gray-950/80 to-blue-900/50 border border-blue-400/40 shadow-[0_0_40px_rgba(0,0,0,0.8),0_20px_60px_rgba(0,0,0,0.5)] p-5'>
					{/* Top glossy highlight - very subtle and smooth */}
					<div className='absolute inset-0 bg-gradient-to-b from-blue-400/4 via-blue-400/2 via-blue-400/1 to-transparent pointer-events-none'></div>

					{/* Animated gradient overlay - softer */}
					<div className='absolute inset-0 bg-gradient-to-tr from-blue-500/3 via-blue-500/1 via-transparent to-cyan-500/3 pointer-events-none'></div>

					{/* Content */}
					<div className='relative'>
						<h4 className='text-white font-semibold mb-4 flex items-center gap-2'>
							<svg
								className='w-5 h-5 text-blue-400'
								fill='none'
								stroke='currentColor'
								viewBox='0 0 24 24'
							>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									strokeWidth={2}
									d='M13 10V3L4 14h7v7l9-11h-7z'
								/>
							</svg>
							Controls
						</h4>
						<div className='space-y-3 text-sm text-gray-300'>
							<div className='flex items-center gap-3'>
								<div className='w-2 h-2 bg-green-400 rounded-full'></div>
								<span>
									<strong>Drag</strong> – move around the map
								</span>
							</div>
							<div className='flex items-center gap-3'>
								<div className='w-2 h-2 bg-green-400 rounded-full'></div>
								<span>
									<strong>Mouse wheel</strong> – zoom in/out
								</span>
							</div>
							{!gameMode && (
								<>
									<div className='flex items-center gap-3'>
										<div className='w-2 h-2 bg-blue-400 rounded-full'></div>
										<span>
											<strong>Click map</strong> – place blue marker
										</span>
									</div>
									<div className='flex items-center gap-3'>
										<div className='w-2 h-2 bg-red-400 rounded-full'></div>
										<span>
											<strong>Click red points</strong> – historic info
										</span>
									</div>
								</>
							)}
							{gameMode && (
								<div className='flex items-center gap-3'>
									<div className='w-2 h-2 bg-purple-400 rounded-full'></div>
									<span>
										<strong>Game Mode</strong> – find the location!
									</span>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Loading Overlay */}
			{!mapReady && (
				<div className='absolute inset-0 z-[60] bg-gray-900/95 backdrop-blur-sm flex items-center justify-center'>
					<div className='text-center'>
						<div className='w-20 h-20 mb-6 mx-auto'>
							<div className='w-full h-full border-4 border-gray-600 border-t-blue-400 rounded-full animate-spin'></div>
						</div>
						<h2 className='text-xl font-bold text-white mb-2'>
							Loading Lunar Map
						</h2>
						<p className='text-blue-300 mb-2'>{currentLayer}</p>
						<div className='flex items-center justify-center gap-2 text-sm text-gray-400'>
							<div className='w-2 h-2 bg-blue-400 rounded-full animate-ping'></div>
							<span>Connecting to NASA/USGS servers...</span>
						</div>
					</div>
				</div>
			)}

			{/* Map Container */}
			<div ref={mapRef} className='w-full h-full z-40' />
		</div>
	)
}

export default WorkingLunarMap
