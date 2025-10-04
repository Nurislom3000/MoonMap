import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from '../components/Home'
import LunarMap from '../components/LunarMap'

const Router = () => {
	return (
		<Routes>
			<Route path='/' element={<Home />} />
			<Route path='/map' element={<LunarMap />} />
		</Routes>
	)
}

export default Router
