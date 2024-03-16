import { Tldraw, track } from "@tldraw/tldraw";
import "@tldraw/tldraw/tldraw.css";
import { FuzzyCanvas } from "./fuzz";
import { useEffect, useRef } from "react";

export default function Canvas() {
	console.log('rendering tldraw canvas');

	return (
		<div className="tldraw__editor">
			<Tldraw>
				<Fuzz />
			</Tldraw>
		</div>
	);
}

const Fuzz = track(() => {
	const interopRef = useRef<FuzzyCanvas | null>(null);

	useEffect(() => {
		if (!interopRef.current) {
			interopRef.current = new FuzzyCanvas();
		}
	}, []);

	return <></>;
})