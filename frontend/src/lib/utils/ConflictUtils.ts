import { IFile } from "common_library";
import { ILine } from "../interfaces";
import { EnumHtmlIds } from "../enums";
import ReactDOMServer from "react-dom/server";
import { ConflictTopPanel } from "../../components/selectedRepository/selectedRepoRight/changes/ConflictTopPanel";
import { ConflictBottomPanel } from "../../components/selectedRepository/selectedRepoRight/changes/ConflictBottomPanel";
import { UiUtils } from "./UiUtils";

export class ConflictUtils{
    static readonly topPanelId = EnumHtmlIds.ConflictEditorTopPanel;
    static readonly bottomPanelId = EnumHtmlIds.ConflictEditorBottomPanel;
    static file?:IFile;
    static currentLines:ILine[];
    static previousLines:ILine[];
    private static heighlightedLineIndexes:number[]=[];
    private static startingMarkers:{conflictNo:number;text:string}[] = [];
    private static endingMarkers:{conflictNo:number;text:string}[] = [];
    private static currentLineDivWidth = 0;
    private static previousLineDivWidth = 0;
    private static hoverTopPanel = false;
    private static hoverBottomPanel = false;
    private static actionTakenConflictNo:number[] = [];

    static get TotalConflict(){
        return ConflictUtils.startingMarkers.length;
    }
    static get Separator(){
        return "=======";
    }

    static GetEndingMarkerText(conflictNo:number){
        return ConflictUtils.endingMarkers.find(_ => _.conflictNo === conflictNo);
    }
    
    static GetUiLinesOfConflict(contentLines: string[]) {
        const currentMarker = "<<<<<<< HEAD";
        const endingMarker = ">>>>>>>";
        
    
        const currentLines:ILine[] = [];
        const previousLines:ILine[] = [];
        let conflictNo = 0;
        let currentChangeDetected = false;
        let incomingChangeDetected = false;
        for(const contentLine of contentLines){
            if(contentLine.startsWith(currentMarker)){
                conflictNo++;
                currentChangeDetected = true;
                incomingChangeDetected = false;
                ConflictUtils.startingMarkers.push({conflictNo,text:contentLine});
                continue;
            }
            if(contentLine === ConflictUtils.Separator){
                currentChangeDetected = false;
                incomingChangeDetected = true;
                continue;
            }
            if(contentLine.startsWith(endingMarker)){
                currentChangeDetected = false;
                incomingChangeDetected = false;
                ConflictUtils.endingMarkers.push({conflictNo,text:contentLine});
                while(currentLines.length > previousLines.length){
                    previousLines.push({textHightlightIndex:[],conflictNo});
                }
                while(currentLines.length < previousLines.length){
                    currentLines.push({textHightlightIndex:[],conflictNo});
                }                
                continue;
            }
            if(currentChangeDetected){
                currentLines.push({
                    text:contentLine,
                    hightLightBackground:true,
                    textHightlightIndex:[],
                    conflictNo
                });
                continue;
            }
            if(incomingChangeDetected){
                previousLines.push({
                    text:contentLine,
                    hightLightBackground:true,
                    textHightlightIndex:[],
                    conflictNo
                });
                continue;
            }
            previousLines.push({
                text:contentLine,
                textHightlightIndex:[],
            })
            currentLines.push({
                text:contentLine,
                textHightlightIndex:[],
            })            
        }
        return {currentLines,previousLines};
    }

    private static resetData(){
        ConflictUtils.hoverBottomPanel = false;
        ConflictUtils.hoverTopPanel = false;
    }

    private static getConflictNo(id:string){
        const value = UiUtils.resolveValueFromId(id);
        return value;
    }

    static ShowEditor(){
        if(!ConflictUtils.currentLines || !ConflictUtils.previousLines)
            return;

        const topPanel = document.getElementById(`${ConflictUtils.topPanelId}`)!;
        const bottomPanel = document.getElementById(`${ConflictUtils.bottomPanelId}`)!;              

        if(!topPanel || !bottomPanel)
            return;
        ConflictUtils.resetData();
        ConflictUtils.currentLineDivWidth = ((ConflictUtils.currentLines.filter(_=> _.text !== undefined).length)+"").length + 3;
        ConflictUtils.previousLineDivWidth = ((ConflictUtils.previousLines.filter(_=> _.text !== undefined).length)+"").length + 3;

        const editorTopHtml = ReactDOMServer.renderToStaticMarkup(ConflictTopPanel({
            currentLines:ConflictUtils.currentLines,
            currentLineDivWidth: ConflictUtils.currentLineDivWidth,
            previousLines:ConflictUtils.previousLines,
            previousLineDivWidth:ConflictUtils.previousLineDivWidth,
        }));

        const editorBottomHtml = ReactDOMServer.renderToStaticMarkup(ConflictBottomPanel({
            currentLines:ConflictUtils.currentLines,
            previousLines:ConflictUtils.previousLines,
        }));

        topPanel.innerHTML = editorTopHtml;
        bottomPanel.innerHTML = editorBottomHtml;

        ConflictUtils.addEventHanlders();
        ConflictUtils.HandleScrolling();
        ConflictUtils.purgeEditorUi();

        ConflictUtils.SetHeighlightedLines();
    }

    private static get topPanelElement(){
        const conflictTop = document.querySelector(".conflict-diff") as HTMLDivElement;
        return conflictTop;
    }

    private static get bottomPanelElement(){
        const conflictBottom = document.querySelector(".conflict-bottom") as HTMLDivElement;
        return conflictBottom;
    }

    private static get incomingCheckBoxes(){
        const checkboxes = document.querySelectorAll<HTMLInputElement>(".conflict-diff .previous input");
        return checkboxes;
    }

    private static get currentCheckBoxes(){
        const checkboxes = document.querySelectorAll<HTMLInputElement>(".conflict-diff .current input");
        return checkboxes;
    }

    private static get acceptAllIncomingCheckBox(){
        return document.querySelector(`#${EnumHtmlIds.accept_all_incoming}`) as HTMLInputElement;
    }

    private static get acceptAllCurrentCheckBox(){
        return document.querySelector(`#${EnumHtmlIds.accept_all_current}`) as HTMLInputElement;
    }

    private static addEventHanlders(){
        const conflictTop = ConflictUtils.topPanelElement;
        const conflictBottom = ConflictUtils.bottomPanelElement;
        conflictTop.addEventListener("mouseenter",()=>{
            ConflictUtils.hoverTopPanel = true;
            ConflictUtils.hoverBottomPanel = false;
        })
        conflictBottom.addEventListener("mouseenter",()=>{
            ConflictUtils.hoverTopPanel = false;
            ConflictUtils.hoverBottomPanel = true;
        })
        const acceptAllIncomingCheck = ConflictUtils.acceptAllIncomingCheckBox;
        acceptAllIncomingCheck.addEventListener("change",(e)=>{
            const checked = !!acceptAllIncomingCheck.checked;
            const checkboxes = ConflictUtils.incomingCheckBoxes;
            checkboxes.forEach(elem => elem.checked = checked);
        })

        const acceptAllCurrentCheck = ConflictUtils.acceptAllCurrentCheckBox;
        acceptAllCurrentCheck.addEventListener("change",(e)=>{
            const checked = !!acceptAllCurrentCheck.checked;
            const checkboxes = ConflictUtils.currentCheckBoxes;
            checkboxes.forEach(elem => elem.checked = checked);
        })

        const incomingCheckBoxes = ConflictUtils.incomingCheckBoxes;
        incomingCheckBoxes.forEach(elem=>{
            elem.addEventListener("change",(e)=>{
                ConflictUtils.updateAcceptAllIncomingCheckboxState();
            })
        })

        const currentCheckBoxes = ConflictUtils.currentCheckBoxes;
        currentCheckBoxes.forEach(elem=>{
            elem.addEventListener("change",(e)=>{
                ConflictUtils.updateTopLeveCurrentCheckboxState();
            })
        })

    }

    private static updateAcceptAllIncomingCheckboxState(){
        const topLevelCheckBox = ConflictUtils.acceptAllIncomingCheckBox;
        const checkboxes = ConflictUtils.incomingCheckBoxes;
        let selectionCount = 0;
        checkboxes.forEach(_=>{
            if(_.checked)
                selectionCount++;
        });

        if(selectionCount === checkboxes.length){
            topLevelCheckBox.checked = true;
            topLevelCheckBox.indeterminate = false;            
        }
        else if(selectionCount > 0){
            topLevelCheckBox.checked = false;
            topLevelCheckBox.indeterminate = true;
        }
        else{
            topLevelCheckBox.checked = false;
            topLevelCheckBox.indeterminate = false;
        }
    }

    private static updateTopLeveCurrentCheckboxState(){
        const topLevelCheckBox = ConflictUtils.acceptAllCurrentCheckBox;
        const checkboxes = ConflictUtils.currentCheckBoxes;
        let selectionCount = 0;
        checkboxes.forEach(_=>{
            if(_.checked)
                selectionCount++;
        });

        if(selectionCount === checkboxes.length){
            topLevelCheckBox.checked = true;
            topLevelCheckBox.indeterminate = false;            
        }
        else if(selectionCount > 0){
            topLevelCheckBox.checked = false;
            topLevelCheckBox.indeterminate = true;
        }
        else{
            topLevelCheckBox.checked = false;
            topLevelCheckBox.indeterminate = false;
        }
    }

    private static purgeEditorUi(){
        const elem = document.querySelector('.check_all_incoming') as HTMLElement;
        if(elem)
            elem.style.width = `${ConflictUtils.previousLineDivWidth}ch`;
        const elem2 = document.querySelector('.check_all_current') as HTMLElement;
        if(elem2)
            elem2.style.width = `${ConflictUtils.currentLineDivWidth}ch`;

    }

    static get totalChangeCount(){
        return ConflictUtils.heighlightedLineIndexes.length;
    }

    private static HandleScrolling(){
        const topPanel = ConflictUtils.topPanelElement;
        const bottomPanel = ConflictUtils.bottomPanelElement;
    
        let handler1 = (e:Event)=>{
            if(!ConflictUtils.hoverTopPanel)
                return;
            const ratio = UiUtils.getVerticalScrollRatio(topPanel);
            const top = UiUtils.getVerticalScrollTop(bottomPanel, ratio);
            bottomPanel?.scrollTo({
                top
            });
        }

        let handler2 = (e:Event)=>{
            if(!ConflictUtils.hoverBottomPanel)
                return;
            const ratio = UiUtils.getVerticalScrollRatio(bottomPanel);
            const top = UiUtils.getVerticalScrollTop(topPanel, ratio);
            topPanel?.scrollTo({                    
                top,
            });
        }

        if(topPanel && bottomPanel){
            topPanel.addEventListener("scroll",handler1)
            bottomPanel.addEventListener("scroll",handler2);
        }
    }

    private static SetHeighlightedLines(){
        ConflictUtils.heighlightedLineIndexes = [];
        let lastItemHightlighted = false;        
        const lenght = ConflictUtils.currentLines?.length || ConflictUtils.previousLines?.length || 0;
        for(let i = 0;i < lenght; i++){
            if(ConflictUtils.currentLines?.[i].hightLightBackground || ConflictUtils.previousLines?.[i].hightLightBackground){
                if(!lastItemHightlighted) {
                    ConflictUtils.heighlightedLineIndexes.push(i);
                    lastItemHightlighted = true;
                }
            }
            else
                lastItemHightlighted = false;
        }
    }

    static FocusHightlightedLine(step:number){
        if(!step)
            return;
        const container = document.querySelector("#"+ConflictUtils.topPanelId);
        if(!ConflictUtils.heighlightedLineIndexes.length)
            return;
        const focusElem = container?.querySelector('.line_numbers')?.children[ConflictUtils.heighlightedLineIndexes[step-1]];
        focusElem?.scrollIntoView({block:"center"});
        ConflictUtils.setBottomPanelScrollPosition();

    }

    private static setBottomPanelScrollPosition(){
        const conflictTop = ConflictUtils.topPanelElement;
        const conflictBottom = ConflictUtils.bottomPanelElement;
        const topScrollRatio = UiUtils.getVerticalScrollRatio(conflictTop);
        const top = UiUtils.getVerticalScrollTop(conflictBottom,topScrollRatio);
        conflictBottom.scrollTo({top});
    }
}