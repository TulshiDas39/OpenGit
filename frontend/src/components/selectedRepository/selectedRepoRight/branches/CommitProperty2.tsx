import { ICommitInfo } from "common_library";
import moment from "moment";
import React, { useEffect } from "react"
import { useMultiState } from "../../../../lib";
import { BranchGraphUtils } from "../../../../lib/utils/BranchGraphUtils";
import { InputText } from "../../../common";

interface ICommitProperty{
    selectedCommit?:ICommitInfo;
}

interface IState{
    selectedCommit?:ICommitInfo;
}

function CommitPropertyComponent(){
    const [state,setState]=useMultiState({} as IState);

    useEffect(()=>{        
        const selectListener = (commit:ICommitInfo)=>{
            setState({selectedCommit:commit});
        }
        BranchGraphUtils.state.selectedCommit.subscribe(selectListener);
        return ()=>{
            BranchGraphUtils.state.selectedCommit.unSubscribe(selectListener);
        }
    },[])

    if(!state.selectedCommit) return null;
    return <div id="commit_property" className="d-flex flex-column w-100 ps-1 overflow-hidden border">
        <h6>Commit properties</h6>
        {!!state.selectedCommit.hash && <span>Sha: {state.selectedCommit.avrebHash}</span>}
        <span>Date: {moment(state.selectedCommit.date).format("D MMM,YYYY") }</span>
        {!!state.selectedCommit.hash && <div className="w-100 overflow-hidden d-flex">
            <span>Author: </span>
            <div><InputText text={state.selectedCommit.author_name}/></div>
            <span>&lt;</span>            
            <div><InputText text={state.selectedCommit.author_email} /></div>
            <span>&gt;</span>
        </div>}
        {/* <span className="w-100 overflow-hidden d-flex">Author: <InputText text={props.selectedCommit.author_name}/> &lt;<InputText text={props.selectedCommit.author_email} />&gt;</span> */}
        <div className="">
            <textarea name="message" rows={8} className="no-resize w-75" 
                value={state.selectedCommit.message} onChange={_=>{}} />            
        </div>
    </div>
}

export const CommitProperty2 = React.memo(CommitPropertyComponent);