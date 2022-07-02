import React, { useEffect, useState } from 'react';
import {
  EditorState,
  convertToRaw,
  convertFromRaw,
  ContentBlock,
  ContentState,
} from 'draft-js';
import 'draft-js/dist/Draft.css';
import Editor from '@draft-js-plugins/editor';
import { Box } from '@mui/material';
import linkifyIt, { LinkifyIt } from 'linkify-it';
import type { SpaceType } from '../space/space';
import type { Arrow } from './arrow';
import { useAppDispatch, useAppSelector } from '~store';
import type { User } from '../user/user';
import tlds from 'tlds';
import moveSelectionToEnd from '../editor/moveSelectionToEnd';
import createIframelyPlugin from '../editor/createIframelyPlugin';
//import useSaveArrow from './useSaveArrow';

const iframelyPlugin = createIframelyPlugin();

const blockStyleFn = (contentBlock: ContentBlock) => {
  const type = contentBlock.getType();
  if (type === 'unstyled') {
    return 'unstyled-content-block'
  }
  return '';
};

const linkify: LinkifyIt = linkifyIt().tlds(tlds);

export function extractLinks(text: string): linkifyIt.Match[] | null {
  return linkify.match(text);
}

interface EditorComponentProps {
  user: User | null;
  space: SpaceType | null;
  arrow: Arrow;
  isReadonly: boolean;
  instanceId: string;
}

export default function EditorComponent(props: EditorComponentProps) {
  const dispatch = useAppDispatch();

  const createLink = {
    sourceId: '',
    targetId: '',
  };// useAppSelector(selectCreateLink);

  const focusedArrowId = null; // useAppSelector(selectFocusedArrowId);
  const focusedSpace = 'FRAME' //useAppSelector(selectFocusedSpace);

  //const instance = useAppSelector(state => selectInstanceById(state, props.instanceId))

  //const { saveArrow } = useSaveArrow(props.arrow.id, props.instanceId);

  const [saveTimeout, setSaveTimeout] = useState(null as ReturnType<typeof setTimeout> | null);
  const [isFocused, setIsFocused] = useState(false);
  const [editorState, setEditorState] = useState(() => {
    if (props.arrow.draft) {
      const contentState = convertFromRaw(JSON.parse(props.arrow.draft)) as ContentState;
      return EditorState.createWithContent(contentState);
    }
    else {
      return EditorState.createEmpty();
    }
  });

  const editorRef = React.createRef<Editor>();

  useEffect(() => {
    if (isFocused && editorRef.current) {
      //editorRef.current.focus();
    }
    if (focusedArrowId === props.arrow.id && focusedSpace === props.space && editorRef.current) {
      editorRef.current.focus();
      // dispatch(setFocused({
      //   space: null,
      //   arrowId: '',
      // }));
    }
  }, [focusedArrowId, focusedSpace, editorRef.current]);

  // useEffect(() => {
  //   if (instance?.isNewlySaved) {
  //     dispatch(updateInstance({
  //       ...instance,
  //       isNewlySaved: false,
  //     }));
  //   }
  //   if (instance?.shouldRefreshDraft && props.arrow.draft) {
  //     const contentState = convertFromRaw(JSON.parse(props.arrow.draft));
  //     if (isFocused) {
  //       setEditorState(moveSelectionToEnd(EditorState.createWithContent(contentState)));
  //     }
  //     else {
  //       setEditorState(
  //         EditorState.createWithContent(contentState)
  //       );
  //     }
  //     dispatch(updateInstance({
  //       ...instance,
  //       shouldRefreshDraft: false,
  //     }));
  //   }
  // }, [props.arrow.draft, instance])

  const handleChange = (newState: EditorState) => {
    if (props.arrow.userId !== props.user?.id || props.arrow.commitDate) {
      return;
    }
    setEditorState(newState);

    const contentState = newState.getCurrentContent();
    const draft = JSON.stringify(convertToRaw(contentState));
    if (draft !== props.arrow.draft) {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
      const timeout = setTimeout(() => {
        //saveArrow(draft);
        setSaveTimeout(null);
      }, 1000);
      setSaveTimeout(timeout);
    }
  };

  const handlePaste = (text: string, html: string, editorState: EditorState) => {
    const result = extractLinks(text)
    if (result) {
      const newEditorState = iframelyPlugin.addEmbed(editorState, { url: result[0].url });
      handleChange(newEditorState);
      return 'handled';
    }
    return 'not-handled'
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const isReadonly = props.isReadonly || !!props.arrow.commitDate || props.arrow.userId !== props.user?.id;
  return (
    <Box sx={{
      marginTop: 1,
      fontSize: 14,
      position: 'relative',
      cursor: createLink.sourceId
        ? 'crosshair'
        : 'text', 
    }}>
      <Editor
        placeholder={
          isReadonly 
            ? ''
            : props.arrow.sourceId === props.arrow.targetId
              ? 'Post text...'
              : 'Link text...'}
        readOnly={isReadonly}
        editorState={editorState}
        handlePastedText={handlePaste}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        spellCheck={true}
        ref={editorRef}
        blockStyleFn={blockStyleFn}
        plugins={[iframelyPlugin]}
      />
    </Box>
  );
}