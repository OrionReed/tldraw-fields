import { Tldraw } from "@tldraw/tldraw";
import "@tldraw/tldraw/tldraw.css";
import { FuzzyField } from "./FuzzyField";

export default function Canvas() {
	return (
		<div className="tldraw__editor">
			<Tldraw
				persistenceKey="fuzzy-canvas"
				onMount={(editor) => {
					new FuzzyField(editor);
				}}
			>
			</Tldraw>
		</div>
	);
}