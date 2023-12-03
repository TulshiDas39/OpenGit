import { DerivedState } from "../../publishers";
import { BranchGraphUtils } from "../BranchGraphUtils";

export class PbViewBoxWidth extends DerivedState<number>{
    constructor(value:number){
        super(value);
        BranchGraphUtils.state.panelWidth.subscribe(this.update.bind(this));
        BranchGraphUtils.state.zoomLabel2.subscribe(this.update.bind(this));
    }
    protected getDerivedValue(): number {
        const panelWidth = BranchGraphUtils.state.panelWidth.value;
        const zoom = BranchGraphUtils.state.zoomLabel2.value;
        return panelWidth / zoom;
    }
    protected applyChange(): void {
        
    }

}