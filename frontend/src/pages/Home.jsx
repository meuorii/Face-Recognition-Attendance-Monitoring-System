import HomeHero from '../components/Home/HomeHero';
import HomeFeatures from '../components/Home/HomeFeatures';
import HomeAbout from '../components/Home/HomeAbout';
import HomeHowItWorks from '../components/Home/HomeHowItWorks';
import HomeFAQs from '../components/Home/HomeFAQs';
import HomeCallToAction from '../components/Home/HomeCallToAction';

function Home() {
    return (
        <div className='w-full'>
            <HomeHero />
            <HomeFeatures />
            <HomeAbout />
            <div id="how-it-works">
            <HomeHowItWorks />
            </div>
            <HomeFAQs />
            <HomeCallToAction />
        </div>
    )
}

export default Home;