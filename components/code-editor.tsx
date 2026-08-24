"use client";

import { indentWithTab } from "@codemirror/commands";
import { java } from "@codemirror/lang-java";
import { python } from "@codemirror/lang-python";
import {
  bracketMatching,
  defaultHighlightStyle,
  foldGutter,
  indentOnInput,
  syntaxHighlighting,
} from "@codemirror/language";
import { Compartment, EditorState } from "@codemirror/state";
import { oneDark } from "@codemirror/theme-one-dark";
import {
  crosshairCursor,
  drawSelection,
  dropCursor,
  EditorView,
  Decoration,
  type DecorationSet,
  highlightActiveLine,
  highlightActiveLineGutter,
  highlightSpecialChars,
  keymap,
  lineNumbers,
  rectangularSelection,
  ViewPlugin,
  type ViewUpdate,
  WidgetType,
} from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { useEffect, useRef, useState } from "react";
import type { LearningLanguage } from "@/lib/learning/catalog";

const languageExtension = {
  python: python(),
  java: java(),
};

class GhostTextWidget extends WidgetType {
  constructor(private readonly value: string) { super(); }
  toDOM() {
    const span = document.createElement("span");
    span.className = "cm-ghost-completion";
    span.textContent = this.value;
    span.setAttribute("aria-hidden", "true");
    return span;
  }
}

function ghostTextExtension(value?: string) {
  if (!value) return [];
  return ViewPlugin.fromClass(class {
    decorations: DecorationSet;
    constructor(view: EditorView) { this.decorations = this.build(view); }
    update(update: ViewUpdate) { this.decorations = this.build(update.view); }
    build(view: EditorView) {
      const position = view.state.selection.main.head;
      const line = view.state.doc.lineAt(position);
      if (position !== line.to) return Decoration.none;
      return Decoration.set([Decoration.widget({ widget: new GhostTextWidget(`  ${value}`), side: 1 }).range(position)]);
    }
  }, { decorations: (plugin) => plugin.decorations });
}

export function CodeEditor({
  value,
  language,
  onChange,
  readOnly = false,
  ghostText,
}: {
  value: string;
  language: LearningLanguage;
  onChange: (value: string) => void;
  readOnly?: boolean;
  ghostText?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [initialValue] = useState(value);
  const changeRef = useRef(onChange);
  const [ghostCompartment] = useState(() => new Compartment());

  useEffect(() => {
    changeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!rootRef.current) return;
    const state = EditorState.create({
      doc: initialValue,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightSpecialChars(),
        history(),
        foldGutter(),
        drawSelection(),
        dropCursor(),
        EditorState.allowMultipleSelections.of(true),
        indentOnInput(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        bracketMatching(),
        rectangularSelection(),
        crosshairCursor(),
        highlightActiveLine(),
        keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
        languageExtension[language],
        ghostCompartment.of([]),
        oneDark,
        EditorView.editable.of(!readOnly),
        EditorView.lineWrapping,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) changeRef.current(update.state.doc.toString());
        }),
      ],
    });
    const view = new EditorView({ state, parent: rootRef.current });
    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [ghostCompartment, initialValue, language, readOnly]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view || view.state.doc.toString() === value) return;
    view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } });
  }, [value]);

  useEffect(() => {
    viewRef.current?.dispatch({ effects: ghostCompartment.reconfigure(ghostTextExtension(ghostText)) });
  }, [ghostCompartment, ghostText]);

  return <div className="code-editor" ref={rootRef} />;
}
