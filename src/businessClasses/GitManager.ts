import { RendererEvents, RepositoryInfo ,CreateRepositoryDetails, IRemoteInfo,IStatus} from "common_library";
import { ipcMain, ipcRenderer } from "electron";
import { existsSync, readdirSync } from "fs-extra";
import simpleGit, { SimpleGit, SimpleGitOptions } from "simple-git";
import { LogFields } from "../dataClasses";
import { CommitParser } from "./CommitParser";
import * as path from 'path';

export class GitManager{
    start(){
        this.addEventHandlers();
    }

    private addEventHandlers(){
        this.addValidGitPathHandler();
        this.addRepoDetailsHandler();
        this.addStatusHandler();
    }

    private addValidGitPathHandler(){
        ipcMain.on(RendererEvents.isValidRepoPath,(e,path:string)=>{
            if(!existsSync(path)) {
                e.returnValue = false;
                return;
            }
            const subDirNames = readdirSync(path, { withFileTypes: true }).filter(dirent => dirent.isDirectory()).map(dirent => dirent.name);
            console.log(subDirNames);
            
            if(subDirNames.every(name=> name !== ".git")) e.returnValue = false;
            else e.returnValue = true;
        })        
    }

    private addRepoDetailsHandler(){
        ipcMain.on(RendererEvents.getRepositoryDetails().channel, async (e,repoInfo:RepositoryInfo)=>{
            const repoDetails = await this.repoDetails(repoInfo);
            e.reply(RendererEvents.getRepositoryDetails().replyChannel,repoDetails);
        });
    }

    private addStatusHandler(){
        ipcMain.on(RendererEvents.getStatus().channel, async (e,repoInfo:RepositoryInfo)=>{
            const repoDetails = await this.getStatus(repoInfo);
            e.reply(RendererEvents.getStatus().replyChannel,repoDetails);
        });
    }

    private async repoDetails(repoInfo:RepositoryInfo){
        const repoDetails = CreateRepositoryDetails();
        repoDetails.repoInfo = repoInfo;
        const git = this.getGitRunner(repoInfo);
        const commits = await this.getCommits(git);
        repoDetails.allCommits = commits;
        
        const remotes = await git.getRemotes(true);
        remotes.forEach(r=>{
            const remote:IRemoteInfo = {
                name:r.name,
                url:r.refs.fetch || r.refs.push,
                actionTyps:[]
            };
            if(!!r.refs.fetch) remote.actionTyps.push("fetch");
            if(!!r.refs.push) remote.actionTyps.push("push");
            repoDetails.remotes.push(remote);
        });
        
        return repoDetails;
    }

    private async getStatus(repoInfo:RepositoryInfo){
        const git = this.getGitRunner(repoInfo);
        const status = await git.status();
        const result = {} as IStatus;
        
        result.ahead = status.ahead;
        result.behind = status.behind;
        result.modified = status.modified.map(x=> ({fileName:path.basename(x),path:x}));
        result.staged = status.staged.map(x=> ({fileName:path.basename(x),path:x}));
        result.isClean = status.isClean();
        result.not_added = status.not_added.map(x=> ({fileName:path.basename(x),path:x}));
        result.deleted = status.deleted.map(x=> ({fileName:path.basename(x),path:x}));
        
        return result;
    }

    private async getCommits(git: SimpleGit){
        const commitLimit=230;
        const LogFormat = "--pretty="+LogFields.Hash+":%H%n"+LogFields.Abbrev_Hash+":%h%n"+LogFields.Parent_Hashes+":%p%n"+LogFields.Author_Name+":%an%n"+LogFields.Author_Email+":%ae%n"+LogFields.Date+":%ad%n"+LogFields.Ref+":%D%n"+LogFields.Message+":%s%n";
        try{
            let res = await git.raw(["log","--exclude=refs/stash", "--all",`--max-count=${commitLimit}`,`--skip=${0*commitLimit}`,"--date=iso-strict", LogFormat]);
            const commits = CommitParser.parse(res);
            return commits;
        }catch(e){
            console.error("error on get logs:", e);
        }
        // return new Promise<number>((resolve,reject)=>{
        //     resolve(7);
        //     let res = await git.raw(["log","--exclude=refs/stash", "--all",`--max-count=${commitLimit}`,`--skip=${0*commitLimit}`,"--date=iso-strict", LogFormat]);

        // })
       
    
    }


    private getGitRunner(repoInfo:RepositoryInfo){
        const options: Partial<SimpleGitOptions> = {
            baseDir: repoInfo.path,
            binary: 'git',
            maxConcurrentProcesses: 6,
         };
        let git = simpleGit(options);  
        return git;
    }
}