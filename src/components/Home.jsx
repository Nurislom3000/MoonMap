import React from 'react'
import HomePageBG from '../assets/HomePageBG.jpg'
import { useNavigate } from 'react-router-dom'

const Home = () => {
	const navigate = useNavigate()
	return (
		<div
			className='w-full h-screen px-[61px] py-[89px]'
			style={{
				backgroundImage: `url(${HomePageBG})`,
				backgroundSize: 'cover',
			}}
		>
			<img
				alt='NASA Space Apps Challenge Logo'
				loading='lazy'
				width='227'
				height='128'
				decoding='async'
				data-nimg='1'
				src='https://assets.spaceappschallenge.org/media/images/Colorway2-Color_White3x.width-440.jpegquality-60.png'
			/>
			<h3 className='text-[#c6d4e4] text-5xl font-medium mt-12'>
				for October 5
			</h3>
			<h1 className='font-semibold text-[90px] text-white mt-1.5'>
				Introducing the moon
			</h1>
			<p className='text-white mt-1.5 text-[20px]'>
				<span>For hackathon festival</span>
				<br />
				<span>Made by - Rasul and Nurislom</span>
			</p>
			<button
				onClick={() => {
					navigate('/map')
				}}
				className='mt-12 w-60 h-16 bg-[#1d2937] text-white font-semibold text-2xl rounded-[50px]'
			>
				fly to the moon
			</button>
		</div>
	)
}

export default Home
