import React, { ReactElement } from 'react';
import Layout from "@theme/Layout";
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Link from '@docusaurus/Link';
import useResizeObserver from 'use-resize-observer'

import { createChart, LineData, UTCTimestamp } from 'lightweight-charts'

import versions from '../../versions.json'

const latestVersion = (versions as string[])[0];

interface HeroProps {
	title: string;
	subTitle: string;
}

function Hero(props: HeroProps) {
	return (
		<div className="hero shadow--lw">
			<div className="container">
				<div className="row">
					<div className="col">
						<h1 className="hero__title">{props.title}</h1>
						<p className="hero__subtitle">{props.subTitle}</p>
						<div>
							<Link to={`/docs/${latestVersion}`} className="button button--secondary button--outline button--lg">
								Get Started
							</Link>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

function ExampleChart() {
	const containerRef = React.useRef()
	const { width, height = 500 } = useResizeObserver({ ref: containerRef })

	React.useEffect(() => {
		if (containerRef.current) {
			const c = createChart(containerRef.current, {
				width,
				height,
			})

			const data: LineData[] = []
			const time = new Date(Date.now())
			const days = 100
			time.setUTCDate(time.getUTCDate() - days)

			for (let i = 0; i < days; i++) {
				data.push({
					value: Math.random() * 100,
					time: time.getTime() / 1000 as UTCTimestamp,
				})
				time.setUTCDate(time.getUTCDate() + 1)
			}

			const l = c.addLineSeries()
			l.setData(data)

			l.createPriceLine({
				price: data[Math.floor(data.length / 2)].value,
				axisLabelVisible: true,
				color: 'red',
				lineStyle: 0, // Solid
				lineWidth: 1,
				title: '',
			})

			c.timeScale().fitContent()

			c.timeScale().applyOptions({
				fixLeftEdge: true,
				fixRightEdge: true,
			})

			return () => {
				c.remove()
			}
		}
	}, [width, height])

	return (
		<div className="container">
			<div className="row margin-top--md">
				<div className="col">
					<div ref={containerRef} style={{ width: '100%', height: '100%' }} />
				</div>
			</div>
		</div>
	)
}

// eslint-disable-next-line import/no-default-export
export default function Home(): ReactElement {
	const { siteConfig } = useDocusaurusContext();
	return (
		<Layout title={`${siteConfig.title} Documentation`}>
			<Hero title={siteConfig.title} subTitle={siteConfig.tagline} />
			<ExampleChart />
		</Layout>
	);
}
