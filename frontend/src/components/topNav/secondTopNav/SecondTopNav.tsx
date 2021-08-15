import React from "react";
import {FaHome} from "react-icons/fa"
import { shallowEqual, useDispatch } from "react-redux";
import { useSelectorTyped } from "../../../store/rootReducer";
import { ActionSavedData } from "../../../store/slices";
import { ActionBar } from "./ActionBar";

function SecondTopNavComponent(){
    const store = useSelectorTyped(state=>({
        hasSelectedRepo:state.savedData.recentRepositories.some(x=>x.isSelected),
    }),shallowEqual);
    const dispatch = useDispatch();
    
    const handleHomeClick=()=>{
        dispatch(ActionSavedData.deSelectRepo());
    }

    return <div className="d-flex bg-third-color py-2 align-items-center">
        <span className="px-2 hover">
            <FaHome className="h5 mb-0" onClick={handleHomeClick} />
        </span>
        {store.hasSelectedRepo && <ActionBar />}        
    </div>
}

export const SecondTopNav = React.memo(SecondTopNavComponent);