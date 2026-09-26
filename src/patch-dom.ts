import type { ElementProps, RuntimeProps } from "./types/props.ts";
import { FiberTag, type Fiber } from "./types/fiber.ts";
import { countProfilerEvent } from "./profiler.ts";

export function createDom(fiber: Fiber): Node {
	if (fiber.tag !== FiberTag.HOST && fiber.tag !== FiberTag.TEXT) {
		throw new Error(`Fiber with tag "${fiber.tag}" does not create a DOM node`);
	}

	const dom =
		fiber.tag === FiberTag.TEXT
			? document.createTextNode("")
			: document.createElement(fiber.type as keyof HTMLElementTagNameMap);

	updateDom(dom, {}, fiber.props);

	return dom;
}

export function updateDom(dom: Node, prevProps: ElementProps, nextProps: ElementProps): void {
	countProfilerEvent("updateDomCalls");
	const prev = prevProps as RuntimeProps;
	const next = nextProps as RuntimeProps;

	Object.keys(prev)
		.filter(isEvent)
		.filter((key) => !(key in next) || isNew(prev, next)(key))
		.forEach((name) => removeEventListener(dom, name, prev[name]));

	Object.keys(prev)
		.filter(isProperty)
		.filter(isGone(prev, next))
		.forEach((name) => removeDomProperty(dom, name));

	Object.keys(next)
		.filter(isProperty)
		.filter(isNew(prev, next))
		.forEach((name) => setDomProperty(dom, name, next[name], prev[name]));

	Object.keys(next)
		.filter(isEvent)
		.filter(isNew(prev, next))
		.forEach((name) => addEventListener(dom, name, next[name]));
}

export function cleanupDom(dom: Node, props: ElementProps): void {
	const runtimeProps = props as RuntimeProps;

	Object.keys(runtimeProps)
		.filter(isEvent)
		.forEach((name) => removeEventListener(dom, name, runtimeProps[name]));
}

const isEvent = (key: string): boolean => key.startsWith("on");
const isProperty = (key: string): boolean => key !== "children" && key !== "key" && !isEvent(key);
const isNew =
	(prev: RuntimeProps, next: RuntimeProps) =>
	(key: string): boolean =>
		prev[key] !== next[key];
const isGone =
	(_prev: RuntimeProps, next: RuntimeProps) =>
	(key: string): boolean =>
		!(key in next);

type EventBinding = {
	type: string;
	capture: boolean;
};

const CAPTURE_SUFFIX = "Capture";
const POINTER_CAPTURE_EVENTS = new Set(["onGotPointerCapture", "onLostPointerCapture"]);
const EVENT_TYPE_ALIASES: Record<string, string> = {
	onDoubleClick: "dblclick",
};

function getEventBinding(name: string): EventBinding {
	const capture = name.endsWith(CAPTURE_SUFFIX) && !POINTER_CAPTURE_EVENTS.has(name);
	const propName = capture ? name.slice(0, -CAPTURE_SUFFIX.length) : name;
	const type = EVENT_TYPE_ALIASES[propName] ?? propName.toLowerCase().substring(2);

	return { type, capture };
}

function addEventListener(dom: Node, name: string, listener: unknown): void {
	if (typeof listener !== "function") {
		return;
	}

	const { type, capture } = getEventBinding(name);
	dom.addEventListener(type, listener as EventListener, capture);
}

function removeEventListener(dom: Node, name: string, listener: unknown): void {
	if (typeof listener !== "function") {
		return;
	}

	const { type, capture } = getEventBinding(name);
	dom.removeEventListener(type, listener as EventListener, capture);
}

function setDomProperty(dom: Node, name: string, value: unknown, prevValue?: unknown): void {
	if (name === "style" && dom instanceof Element) {
		setStyleProperty(dom, value, prevValue);
		return;
	}

	if ((name === "class" || name === "className") && dom instanceof Element) {
		setClassProperty(dom, value);
		return;
	}

	if (OVERLOADED_BOOLEAN_ATTRIBUTES.has(name) && dom instanceof Element) {
		setOverloadedBooleanAttribute(dom, name, value);
		return;
	}

	if (name in dom) {
		(dom as unknown as Record<string, unknown>)[name] = value;
		return;
	}

	if (dom instanceof Element) {
		if (value === null || value === undefined || value === false) {
			dom.removeAttribute(name);
		} else {
			dom.setAttribute(name, String(value));
		}
	}
}

function removeDomProperty(dom: Node, name: string): void {
	if (name === "style" && dom instanceof Element) {
		setStyleProperty(dom, null, undefined);
		return;
	}

	if ((name === "class" || name === "className") && dom instanceof Element) {
		dom.removeAttribute("class");
		return;
	}

	if (dom instanceof Element) {
		dom.removeAttribute(name);
	}

	const domProperties = dom as unknown as Record<string, unknown>;
	if (name in dom && typeof domProperties[name] === "boolean") {
		(dom as unknown as Record<string, boolean>)[name] = false;
	}
}

const OVERLOADED_BOOLEAN_ATTRIBUTES = new Set(["download"]);

function setOverloadedBooleanAttribute(dom: Element, name: string, value: unknown): void {
	if (value === null || value === undefined || value === false) {
		dom.removeAttribute(name);
		return;
	}

	dom.setAttribute(name, value === true ? "" : String(value));
}

function setClassProperty(dom: Element, value: unknown): void {
	if (value === null || value === undefined || value === false) {
		dom.removeAttribute("class");
		return;
	}

	dom.setAttribute("class", String(value));
}

function setStyleProperty(dom: Element, value: unknown, prevValue: unknown): void {
	const style = (dom as HTMLElement | SVGElement).style;

	if (value === null || value === undefined || value === false) {
		style.cssText = "";
		return;
	}

	if (!isStyleObject(value)) {
		return;
	}

	if (isStyleObject(prevValue)) {
		Object.keys(prevValue)
			.filter((name) => !(name in value))
			.forEach((name) => setStyleValue(style, name, ""));
	}

	Object.entries(value).forEach(([name, styleValue]) => {
		setStyleValue(style, name, styleValue);
	});
}

const UNITLESS_STYLE_PROPERTIES = new Set([
	"animationIterationCount",
	"aspectRatio",
	"borderImageOutset",
	"borderImageSlice",
	"borderImageWidth",
	"columnCount",
	"columns",
	"flex",
	"flexGrow",
	"flexShrink",
	"fontWeight",
	"gridArea", //
	"gridColumn",
	"gridColumnEnd",
	"gridColumnStart",
	"gridRow",
	"gridRowEnd",
	"gridRowStart",
	"lineClamp",
	"lineHeight",
	"opacity",
	"order",
	"orphans",
	"scale",
	"tabSize",
	"widows",
	"zIndex",
	"zoom",
	"fillOpacity",
	"floodOpacity",
	"stopOpacity",
	"strokeDasharray",
	"strokeDashoffset",
	"strokeMiterlimit",
	"strokeOpacity",
	"strokeWidth",
]);

function setStyleValue(style: CSSStyleDeclaration, name: string, value: unknown): void {
	const normalizedValue = normalizeStyleValue(name, value);

	if (name.startsWith("--") || name.includes("-")) {
		style.setProperty(name, normalizedValue);
		return;
	}

	(style as unknown as Record<string, string>)[name] = normalizedValue;
}

function normalizeStyleValue(name: string, value: unknown): string {
	if (value === null || value === undefined) {
		return "";
	}

	if (typeof value === "number" && value !== 0 && !isUnitlessStyleProperty(name)) {
		return `${value}px`;
	}

	return String(value);
}

function isUnitlessStyleProperty(name: string): boolean {
	return name.startsWith("--") || UNITLESS_STYLE_PROPERTIES.has(toCamelCase(name));
}

function toCamelCase(name: string): string {
	return name.replace(/-([a-z])/g, (_match, letter: string) => letter.toUpperCase());
}

function isStyleObject(
	value: unknown,
): value is Record<string, string | number | null | undefined> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
