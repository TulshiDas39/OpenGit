import React, { useCallback, useEffect, useMemo } from "react"
import { useSelectorTyped } from "../../../../store/rootReducer";
import { shallowEqual } from "react-redux";
import { EnumChangeGroup, useMultiState } from "../../../../lib";
import { ModifiedChanges } from "./ModifiedChanges";
import { IFile } from "common_library";
import { StagedChanges } from "./StagedChanges";

interface IProps{
    handleSelectFile:(file:IFile,group:EnumChangeGroup)=>void;
    selectedFile?:IFile;
    group:EnumChangeGroup;
}

interface IState{
    selectedTab:EnumChangeGroup;
}

function ChangesTabPaneComponent(props:IProps){
    const store = useSelectorTyped(state=>({
       status:state.ui.status,
       recentRepositories:state.savedData.recentRepositories,
    }),shallowEqual);

    const [state,setState] = useMultiState({
        selectedTab:EnumChangeGroup.UN_STAGED
    } as IState)
    
    const handleSelect = useCallback((changedFile:IFile,changeGroup:EnumChangeGroup)=>{
        props.handleSelectFile(changedFile,changeGroup);
    },[])

    useEffect(()=>{
        if(!store.status?.staged.length && state.selectedTab === EnumChangeGroup.STAGED){
            setState({selectedTab:EnumChangeGroup.UN_STAGED});
        }
    },[!!store.status?.staged.length])

    const repoInfo = useMemo(()=>{
        return store.recentRepositories.find(x=>x.isSelected);
    },[store.recentRepositories])

    if(!store.status)
        return <div></div>;

    return <div className="flex-grow-1 d-flex flex-column">
        <div className="row g-0 px-1 flex-nowrap overflow-auto">
            <div className={`col border cur-default text-center ${state.selectedTab === EnumChangeGroup.UN_STAGED ?"bg-select-color":""}`}
            onClick={_=> setState({selectedTab:EnumChangeGroup.UN_STAGED})}>
                <span>Modified</span><br/>
                <span>({store.status?.unstaged.length || 0})</span>
            </div>
            {!!store.status?.staged?.length && <div className={`col border cur-default text-center ${state.selectedTab === EnumChangeGroup.STAGED ?"bg-select-color":""}`} 
            onClick={_=> setState({selectedTab:EnumChangeGroup.STAGED})}>
                <span>Staged</span><br/>
                <span>({store.status?.staged.length || 0})</span>
            </div>}
            {!!store.status?.conflicted?.length && <div className={`col border cur-default text-center ${state.selectedTab === EnumChangeGroup.CONFLICTED ?"bg-select-color":""}`} onClick={_=> setState({selectedTab:EnumChangeGroup.CONFLICTED})}>
                <span>Clonflicted</span><br/>
                <span>({store.status?.conflicted.length || 0})</span>
            </div>}
        </div>
        <div className="flex-grow-1">            
            {state.selectedTab === EnumChangeGroup.UN_STAGED && <ModifiedChanges changes={store.status?.unstaged!} onFileSelect={file=> handleSelect(file, EnumChangeGroup.UN_STAGED)} 
            selectedMode={state.selectedTab} repoInfoInfo={repoInfo} />}
            {state.selectedTab === EnumChangeGroup.STAGED &&
            <StagedChanges changes={store.status?.staged!} handleSelect={file=> handleSelect(file, EnumChangeGroup.STAGED)} 
            selectedMode={state.selectedTab} repoInfoInfo={repoInfo} />}
        </div>
    </div>
}

export const ChangesTabPane = React.memo(ChangesTabPaneComponent);