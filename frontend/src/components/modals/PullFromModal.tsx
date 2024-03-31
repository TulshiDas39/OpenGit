import React, { useEffect } from "react";
import { AppButton } from "../common";
import { Modal, Form } from "react-bootstrap";
import { shallowEqual, useDispatch } from "react-redux";
import { EnumModals, useMultiState, BranchUtils } from "../../lib";
import { IpcUtils } from "../../lib/utils/IpcUtils";
import { ActionModals, ActionSavedData } from "../../store";
import { useSelectorTyped } from "../../store/rootReducer";
import { ActionUI } from "../../store/slices/UiSlice";

interface IState{
    branch:string;
    remember:boolean;
}

function PullFromModalComponent(){
    const store = useSelectorTyped(state=>({
        show:state.modal.openedModals.includes(EnumModals.PULL_FROM),        
    }),shallowEqual);

    const [state,setState] = useMultiState<IState>({
        branch:"",
        remember:false,
    });

    const dispatch = useDispatch();

    const closeModal=()=>{
        dispatch(ActionModals.hideModal(EnumModals.PULL_FROM));
        clearState();
    }

    const clearState = ()=>{
        setState({branch:"",remember:false});;
    }

    const handlePull=()=>{
        if(!state.branch)
            return ;
        closeModal();
        //const originName = BranchUtils.activeOriginName;
        const options:string[] = [];
        dispatch(ActionUI.setLoader({text:"Pull in progress..."}));
        IpcUtils.trigerPull(options).then(()=>{
            IpcUtils.getRepoStatus().finally(()=>{                
                dispatch(ActionUI.setLoader(undefined));
            })
        }).finally(()=>{
            const newPullFrom = state.remember ? state.branch:"";
            const repo = BranchUtils.repositoryDetails.repoInfo;
            if(newPullFrom !== repo?.pullFromBranch){            
                repo.pullFromBranch = newPullFrom;
                dispatch(ActionSavedData.updateRepository(repo));
            }
        })
        
    }

    useEffect(()=>{
        if(!store.show)
            return ;
        const pullFromBranch = BranchUtils.repositoryDetails.repoInfo.pullFromBranch || "";
        setState({branch:pullFromBranch,remember:!!pullFromBranch});
    },[store.show])

    return <Modal show={store.show} centered size="sm" backdrop={false}>
    <Modal.Body>
        <div className="container">
            <div className="row g-0">
                <div className="col-11">
                    <span className="text-success">Pull</span>
                </div>
                <div className="col-1 text-end">
                    <span className="hover" onClick={_=> dispatch(ActionModals.hideModal(EnumModals.PULL_FROM))}>&times;</span>
                </div>
            </div>
            <hr />
            <div className="row g-0">
                <div className="col-12 text-break overflow-auto" style={{maxWidth:600,maxHeight:500}}>
                    <Form.Control type="text" value={state.branch} onChange={e=>setState({branch:e.target.value})} />
                </div>
            </div>
            <div className="row g-0">
                <div className="col-12 pt-2 text-break overflow-auto d-flex align-items-center justify-content-center" style={{maxWidth:600,maxHeight:500}}>
                    <AppButton text="Pull" type="success" onClick={handlePull} />
                </div>
            </div>
            <div className="row g-0">
                <div className="col-12 pt-2 text-break overflow-auto d-flex align-items-center justify-content-center" style={{maxWidth:600,maxHeight:500}}>
                    <input id="remember_pull" type="checkbox" checked={state.remember} onChange={e=>setState({remember:e.target.checked})} />
                    <label htmlFor="remember_pull">
                        <span className="ps-2">Remember</span>
                    </label>
                </div>
            </div>
        </div>
    </Modal.Body>
</Modal>
}

export const PullFromModal = React.memo(PullFromModalComponent);