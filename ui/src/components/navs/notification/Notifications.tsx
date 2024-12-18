import React, { useRef } from "react"
import { FaRegBell } from "react-icons/fa";
import { BellWithDot } from "../../common";
import { Overlay } from "react-bootstrap";
import { useMultiState } from "../../../lib";
import { SingleNotification } from "./SingleNotification";
import { useSelectorTyped } from "../../../store/rootReducer";
import { shallowEqual } from "react-redux";

interface IState{
    show:boolean;
}
function NotificationsComponent(){
    const store = useSelectorTyped(state=>({
        notifications:state.ui.notifications,        
    }),shallowEqual);

    const [state, setState] = useMultiState<IState>({show:false});
    const target = useRef<HTMLElement>(null!);

    return <div className="ps-1 pe-2">
            <span title="Notifications" ref={target as any} className="d-flex align-items-center" 
                onClick={() => setState({show:!state.show})}>
                {true? <FaRegBell />: <BellWithDot /> }
            </span>
            <Overlay target={target.current} show={state.show} placement="top-end"
                rootClose={true} rootCloseEvent="click" onHide={() => setState({show:false})}>
                {({
                placement: _placement,
                arrowProps: _arrowProps,
                show: _show,
                popper: _popper,
                hasDoneInitialMeasure: _hasDoneInitialMeasure,
                ...props
                }) => (
                <div
                    {...props}
                    className="bg-color border"
                    style={{
                    position: 'absolute',
                    padding: '2px 10px',
                    borderRadius: 3,
                    width:350,
                    ...props.style,
                    }}
                >
                    {/* <div className="pt-3">
                        No notifications found.
                    </div> */}
                    <div className="py-2">
                        {!store.notifications.length && <span>No new notifications</span>}
                        {store.notifications.map(n=>(
                            <SingleNotification key={n._id} data={{message:n.message}}  />
                        ))}
                        {/* <SingleNotification data={{message:"notification 1"}}  />
                        <SingleNotification data={{message:"notification 2"}}  /> */}
                    </div>
                    
                </div>
                )}
        </Overlay>
        </div>
    
}

export const Notifications = React.memo(NotificationsComponent);