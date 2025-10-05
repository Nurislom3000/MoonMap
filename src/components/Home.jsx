import React from 'react'
import HomePageBG from '../assets/HomePageBG.jpg'
import { useNavigate } from 'react-router-dom'
import Logo from '../assets/Logo.png'
import MapImg from '../assets/Map.svg'
import NewspaperImg from '../assets/Newspaper.svg'
import GamepadImg from '../assets/Gamepad.svg'
import Moon from '../assets/Moon.png'
import BottomMap from '../assets/BottomMap.jpg'
import BottomSpace from '../assets/BottomSpace.jpg'
import BottomLine from '../assets/BottomLine.png'
import BottomConstruction from '../assets/BottomConstruction.png'

const Home = () => {
	const navigate = useNavigate()
	return (
		<div className='text-white'>
			<div
				className='flex flex-col items-center w-full h-[1103px] px-[61px] py-[89px] text-white'
				style={{
					backgroundImage: `url(${HomePageBG})`,
					backgroundSize: 'cover',
				}}
			>
				<div className='flex justify-center items-center gap-20'>
					<img
						alt='NASA Space Apps Challenge Logo'
						loading='lazy'
						width='162'
						height='64'
						decoding='async'
						data-nimg='1'
						src='https://assets.spaceappschallenge.org/media/images/Colorway2-Color_White3x.width-440.jpegquality-60.png'
					/>
					<div
						className='flex flex-col items-center'
						onClick={() => navigate('/')}
					>
						<img
							src={Logo}
							className='mb-[-7px]'
							alt='#'
							width='83'
							height='76'
							decoding='async'
							data-nimg='1'
							loading='lazy'
						/>
						<p>W-twins</p>
					</div>
				</div>
				<h3 className=' mt-11 font-semibold text-6xl '>
					Bringing the Moon Closer
				</h3>
				<h5 className='font-light text-2xl  mt-2'>
					Zoom into moon with crazy details
				</h5>
				<div className='HomePageButtonGradient mt-10 rounded-[50px] px-[35px] py-[13px] flex items-center justify-center'>
					<button
						onClick={() => {
							navigate('/map')
						}}
						className='font-semibold text-[23px] rounded-[50px] w-[378px] h-[50px] HomePageInnerButtonGradient'
					>
						Embiggen Your Eyes!
					</button>
				</div>

				<div className='flex gap-9 mt-28'>
					<div className='borderGradientHome1 rounded-[30px] p-[2px]'>
						<div className='rounded-[30px] w-[465px] h-[272px] bg-[#222] px-[40px] py-[35px]'>
							<div className='flex items-center gap-2'>
								<img src={GamepadImg} alt='#' />
								<p className='font-semibold text-3xl'>Games</p>
							</div>
							<p className='font-thin tracking-[2px] text-[26px] mt-2.5 leading-[30px]'>
								Play interactive games on the <br /> moon, spot the craters and{' '}
								<br />
								sateline landings
							</p>
							<div className='flex justify-end'>
								<button
									className='font-medium text-[22px] mt-[17px] rounded-[50px] w-[156px] h-[50px] bg-gradient-to-r from-[rgba(158,74,255,0.5)] via-[rgba(255,91,217,0.5)] to-[rgba(255,150,175,0.5)]'
									onClick={() => navigate('/map?game=1')}
								>
									Play now!
								</button>
							</div>
						</div>
					</div>
					<div className='borderGradientHome2 rounded-[30px] p-[2px]'>
						<div className='rounded-[30px] w-[485px] h-[272px] bg-[#222] px-[40px] py-[35px]'>
							<div className='flex items-center gap-4'>
								<img src={MapImg} alt='#' />
								<p className='font-semibold text-3xl'>Moon Map</p>
							</div>
							<p className='font-thin tracking-[2px] text-[26px] mt-2.5 leading-[30px]'>
								Explore the moon, rocket landings <br /> and cordinates of spots
								and <br /> Incredible quality
							</p>
						</div>
					</div>
					<div className='borderGradientHome3 rounded-[30px] p-[2px]'>
						<div className='rounded-[30px] w-[485px] h-[272px] bg-[#222] px-[40px] py-[35px]'>
							<div className='flex items-center gap-4'>
								<img src={NewspaperImg} alt='#' />
								<p className='font-semibold text-3xl'>Recent news</p>
							</div>
							<p className='font-thin tracking-[2px] text-[26px] mt-2.5 leading-[30px]'>
								Check out the mind-blowing <br /> recent news about the moon for{' '}
								<br />
								2025!
							</p>
							<div className='flex justify-end'>
								<a
									href='https://science.nasa.gov/moon/'
									className='font-medium flex justify-center items-center text-[22px] mt-[15px] rounded-[50px] w-[156px] h-[50px] bg-gradient-to-r from-[#9bffb2] to-[#00820b] opacity-80'
								>
									Read
								</a>
							</div>
						</div>
					</div>
				</div>
				<div className='flex justify-center mt-[-60px]'>
					<img src={Moon} alt='#' width={1521} />
				</div>
			</div>

			<div className='w-screen h-[619px] bg-[#211f22] z-10 relative px-[97px] py-[100px] flex gap-[22px]'>
				<div className='border border-[rgba(255,255,255,0.25)] rounded-[30px] w-[397px] h-[430px] footerBgGradient1 px-[35px] py-[39px]'>
					<img
						src={BottomMap}
						alt='#'
						className='w-[191px] h-[191px] rounded-4xl'
					/>
					<p className='text-[30px] mt-8 font-semibold'>Moon map</p>
					<p className='text-[25px] font-thin leading-[30px] mt-[19px]'>
						Zoom in and see the Moon in amazing detail.
					</p>
				</div>
				<div className='border border-[rgba(255,255,255,0.25)] rounded-[30px] w-[397px] h-[430px] footerBgGradient2 px-[35px] py-[39px]'>
					<img
						src={BottomSpace}
						alt='#'
						className='w-[288px] h-[191px] rounded-4xl'
					/>
					<p className='text-[30px] mt-8 font-semibold'>Historic Sites</p>
					<p className='text-[25px] font-thin leading-[30px] mt-[19px]'>
						Earn about Apollo landings, craters, and basins.
					</p>
				</div>
				<div className='border border-[rgba(255,255,255,0.25)] rounded-[30px] w-[397px] h-[430px] footerBgGradient3 px-[35px] py-[39px]'>
					<img
						src={BottomLine}
						alt='#'
						className='w-[341px] h-[191px] rounded-4xl'
					/>
					<p className='text-[30px] mt-8 font-semibold'>Games</p>
					<p className='text-[25px] font-thin leading-[30px] mt-[19px]'>
						Test yourself by finding spots on the Moon.
					</p>
				</div>
				<div className='border border-[rgba(255,255,255,0.25)] rounded-[30px] w-[397px] h-[430px] footerBgGradient4 px-[35px] py-[39px]'>
					<img
						src={BottomConstruction}
						alt='#'
						className='w-[200px] h-[191px] rounded-4xl'
					/>
					<p className='text-[30px] mt-8 font-semibold'>Recent News</p>
					<p className='text-[25px] font-thin leading-[30px] mt-[19px]'>
						Stay updated with Moon news 2025
					</p>
				</div>
			</div>
		</div>
	)
}

export default Home
