const livesReducer=(state=3, action)=>{
    switch(action.type){
        case 'DECREMENT':
            return state-1
        default:
            return state;
    }
}
export default livesReducer;