declare module 'remark-join-cjk-lines' {
	type Node = {
		type: string;
		children?: Node[];
		value?: string;
	};

	type Transformer = (tree: Node) => void;

	function remarkJoinCjkLines(): Transformer;

	export = remarkJoinCjkLines;
}
