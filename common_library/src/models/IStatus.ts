import { ICommitInfo } from "./ICommitInfo";
import { IFile } from "./IFile";
import { IHeadCommitInfo } from "./IHeadCommitInfo";

export interface IStatus{
    ahead:number;
    behind:number;
    staged:IFile[];
    unstaged:IFile[];
    conflicted:IFile[];
    renamed:{
        from:string;
        to:string;
    }[];
    isClean:boolean;
    current:string | null;
    isDetached:boolean;
    headCommit:IHeadCommitInfo;
    mergingCommitHash?:string;
    trackingBranch?:string;
    totalChangedItem:number;
    totalStagedItem:number;
    totalUnStagedItem:number;
    totalConflictedItem:number;
    rebasingCommit:ICommitInfo;
    cherryPickingCommit:ICommitInfo;
}

export interface IChanges{
    created:IFile[];
    modified:IFile[];
    deleted:IFile[];
}