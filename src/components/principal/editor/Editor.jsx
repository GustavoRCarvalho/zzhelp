import { useDispatch, useSelector } from "react-redux"
import { useLocation } from "react-router-dom"
import { EditorComponent } from "./EditorComponent"
import styled from "styled-components"
import { memo, useEffect, useMemo, useState } from "react"
import { CategoryDropdown } from "./CategoryDropdown"
import {
  changeBackgroundArticle,
  setEditorImage,
  setEditorInitial,
  setEditorName,
} from "../../../store/editorSlice"
import { SubCategoryDropdown } from "./SubCategoryDropdown"
import { ArticleDropdown } from "./ArticleDropdown"
import { updateJsonFile } from "../../../utils/googleDriveApi"
import ReactQuill from "react-quill"
import { modules } from "../../../utils/functions"
import { Spinner } from "../driveApi/ManipulateListItem"
import { LoadingScreen } from "../../../router/LoadingScreen"
import { createAlertError, createAlertSucess } from "../../../store/alertSlice"
import { useFetchData } from "../driveApi/useFetchData"
import { useCookies } from "react-cookie"
import { GoImage } from "react-icons/go"

export const Editor = memo(() => {
  const location = useLocation()
  const dispatch = useDispatch()
  const [backgroundColor, setBackgroundColor] = useState(0)
  const colors = [
    "var(--home-card-background)",
    "#3f7ee8",
    "#66be67",
    "#f3c324",
    "#ef9441",
    "#df5e5a",
  ]
  const [isSaving, setIsSaving] = useState(false)
  const editorState = useSelector((state) => state.editor)
  const isChanged = useMemo(
    () => editorState.isChanged,
    [editorState.isChanged]
  )
  const editorData = useMemo(
    () => editorState.environment ?? [],
    [editorState.environment]
  )
  const imageSrc = editorData.environmentImage
    ? `data:image/png;base64,${editorData.environmentImage}`
    : ""

  const articleBackgroundColor = useMemo(() => {
    if (
      editorState.selectedCategoryIndex !== -1 &&
      editorState.selectedSubCategoryIndex !== -1 &&
      editorState.selectedArticleIndex !== -1
    ) {
      return editorData?.categories[editorState.selectedCategoryIndex]
        ?.subCategories[editorState.selectedSubCategoryIndex]?.articles[
        editorState.selectedArticleIndex
      ]?.backgroundColor
    } else {
      return "var(--home-card-background)"
    }
  }, [
    editorData?.categories,
    editorState.selectedArticleIndex,
    editorState.selectedCategoryIndex,
    editorState.selectedSubCategoryIndex,
  ])

  const params = new URLSearchParams(location.search)
  const environment = params.get("environment")

  const [cookies, setCookies] = useCookies([`editor${environment}`])

  const { data, loading, error } = useFetchData(
    cookies[`editor${environment}`] ? "" : environment
  )

  useEffect(() => {
    if (cookies[`editor${environment}`]) {
      dispatch(setEditorInitial(cookies[`editor${environment}`]))
      return
    }
    if (loading) return
    if (data) {
      dispatch(setEditorInitial(data))

      setCookies(`editor${environment}`, data, { path: "/" })
      return
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, dispatch, environment])

  const handleChangeColor = () => {
    if (editorState.selectedArticleIndex === -1) {
      return
    }

    if (backgroundColor === colors.length - 1) {
      setBackgroundColor(0)
      return
    }
    setBackgroundColor((state) => (state += 1))

    dispatch(changeBackgroundArticle({ newColor: colors[backgroundColor] }))
  }

  async function saveData() {
    try {
      setIsSaving(true)
      await updateJsonFile(environment, editorData)

      setCookies(`editor${environment}`, editorData, { path: "/" })

      dispatch(createAlertSucess("Dados salvos com sucesso!"))
    } catch (e) {
      dispatch(
        createAlertError(
          "Falha ao salvar os dados. Por favor, tente novamente."
        )
      )
    } finally {
      setIsSaving(false)
    }
  }

  useEffect(() => {
    function beforeUnload(e) {
      if (isChanged) {
      }
      e.preventDefault()
    }
    window.addEventListener("beforeunload", beforeUnload, { capture: true })
    window.addEventListener("popstate", beforeUnload, {
      capture: true,
    })

    return () => {
      window.removeEventListener("beforeunload", beforeUnload, {
        capture: true,
      })
      window.removeEventListener("popstate", beforeUnload, {
        capture: true,
      })
    }
  }, [isChanged])

  function handleFile(e) {
    if (!e.target.files.length) return
    const file = e.target.files[0]
    const reader = new FileReader()
    let base64String

    reader.onload = function (event) {
      base64String = event.target.result.split(",")[1]
      dispatch(setEditorImage(base64String))
    }
    reader.readAsDataURL(file)
  }

  return !cookies[`editor${environment}`] ? (
    <LoadingScreen errorMessage={error} />
  ) : (
    <EditorContainer
      $readOnly={editorState.selectedArticleIndex === -1}
      $backgroundColor={articleBackgroundColor}
    >
      <EditInfoContainer>
        <InputImage $select={editorData.environmentImage !== ""}>
          <label htmlFor="file-upload">
            <GoImage />
            <img alt="logo" src={imageSrc} />
          </label>
          <input
            id="file-upload"
            accept="image/*"
            type="file"
            onChange={handleFile}
          />
        </InputImage>
        <TitleText>
          <TitleInput
            type="text"
            value={editorData.environmentName}
            onChange={(e) => dispatch(setEditorName(e.target.value))}
          />
        </TitleText>
      </EditInfoContainer>
      <EditOptionsContainer>
        <DropdownWrapper>
          <CategoryDropdown />
          <SubCategoryDropdown />
          <ArticleDropdown />
        </DropdownWrapper>
      </EditOptionsContainer>
      {editorState.selectedArticleIndex !== -1 ? (
        <EditorComponent />
      ) : (
        <ReactQuill readOnly theme="snow" modules={modules} />
      )}
      <SaveContainer>
        <button onClick={handleChangeColor}>Trocar cor do fundo</button>
        <button onClick={saveData}>Salvar {isSaving && <Spinner />}</button>
      </SaveContainer>
    </EditorContainer>
  )
})

const TitleText = styled.div`
  position: relative;
  width: max-content;

  display: flex;
  align-items: center;

  gap: 0.3em;

  svg {
    width: 1.5em;
    height: 1.5em;
    cursor: pointer;
  }
`

const TitleInput = styled.input`
  background-color: var(--home-card-background);
  font-size: 1em;

  width: 100%;

  display: flex;
  align-items: center;

  border: none;
  border-radius: 0.25em;

  outline: none;

  color: var(--home-card-color);

  text-align: center;

  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const EditInfoContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;

  font-size: 1.5em;

  gap: 1em;

  width: 100%;

  margin-bottom: 1em;

  svg {
    cursor: pointer;
  }
`

const InputImage = styled.div`
  background-color: var(--home-card-background);
  border-radius: 0.25em;
  cursor: pointer;

  width: 2.5em;
  height: 2.5em;
  padding: 0.1em;

  input {
    &[type="file"] {
      display: none;
    }
  }

  label {
    display: flex;
    align-items: center;
    justify-content: center;

    width: 100%;
    height: 100%;

    aspect-ratio: 1;
    cursor: pointer;
  }

  svg {
    display: ${(props) => (props.$select ? "none" : "block")};
    color: ${(props) =>
      props.$alert ? "#ff3f3f" : props.$select ? "#92ff71" : "#d4d0d0"};
    width: 100%;
    height: 100%;

    cursor: pointer;
  }

  img {
    display: ${(props) => (props.$select ? "block" : "none")};
    width: 100%;
    height: 100%;
    border-radius: 0.15em;

    cursor: pointer;
  }
`

const EditOptionsContainer = styled.div`
  position: relative;
  width: 100%;

  height: 70px;
  margin-bottom: 1.5em;
`

const DropdownWrapper = styled.div`
  position: absolute;
  left: 0;
  top: 0;

  display: flex;
  width: 100%;

  gap: 1em;

  z-index: 1;
`

const SaveContainer = styled.div`
  display: flex;
  justify-content: space-between;

  width: 100%;
  max-width: 920px;

  padding-block: 1em;
  margin-top: 5em;

  button {
    background-color: var(--home-card-background);
    color: var(--home-card);
    font-size: 1em;

    display: flex;
    align-items: center;
    gap: 1em;

    border-radius: 0.5em;

    border: none;
    padding: 0.5em 1.5em;

    box-shadow: 0em 0em 1em 0em #0000004b;

    cursor: pointer;
  }
`

const EditorContainer = styled.div`
  width: 100%;
  max-width: 920px;
  min-height: calc(100dvh - (2em));

  padding: 1em;
  /* padding-top: 76px; */

  display: flex;
  flex-direction: column;
  justify-content: start;
  align-items: center;

  overflow-x: hidden;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 10px;
  }

  /* Track */
  &::-webkit-scrollbar-track {
    background: transparent;
    margin: 5px;
  }

  /* Handle */
  &::-webkit-scrollbar-thumb {
    background: #888;

    border-radius: 1em;
  }

  /* Handle on hover */
  &::-webkit-scrollbar-thumb:hover {
    background: #aaa;
  }

  .quill {
    width: 100%;
    height: 100%;
  }

  .ql-toolbar {
    background-color: var(--home-card-background);
    border: none;

    border-radius: 0.5em;
    box-shadow: 0em 0em 1em 0em #0000004b;
  }

  .ql-picker-options {
    background-color: var(--home-card-background);
  }

  .ql-color-picker.ql-color .ql-picker-item:hover {
    border-color: var(--editor-color);
  }

  .ql-toolbar.ql-snow {
    text-align: center;
    .ql-picker.ql-expanded {
      .ql-picker-label {
        border: 1px solid var(--editor-color);
        border-radius: 0.5em;
        color: var(--editor-color-hover);
      }
      .ql-picker-options {
        border-radius: 0.5em;
        border: none;
      }
    }

    button:hover,
    button:focus,
    .ql-picker-label:hover,
    .ql-picker-item:hover,
    .ql-picker-item.ql-selected {
      color: var(--editor-color-hover);
      .ql-stroke {
        stroke: var(--editor-color-hover);
      }
      .ql-fill {
        fill: var(--editor-color-hover);
      }
    }
  }

  .ql-picker-item {
  }

  .ql-container {
    border: none;

    margin-top: 2em;
    min-height: calc(100% - (24px + 5em));
  }

  .ql-editor {
    background-color: ${(props) =>
      props.$backgroundColor ?? "var(--home-card-background)"};

    height: 100%;

    border-radius: 0.5em;

    box-shadow: 0em 0em 1em 0em #0000004b;
    * {
      cursor: ${(props) => (props.$readOnly ? "default" : "text")};
    }
  }

  .ql-fill {
    fill: var(--editor-color);
  }
  .ql-stroke {
    stroke: var(--editor-color);
  }
  .ql-picker {
    color: var(--editor-color);
  }
`
