/**
 * Button component:
 * Defines the props needed for the button 
 */


const Button = ({color,text,onClick, type = "button"}) => {
  return (
    <button onClick={onClick} style = {{backgroundColor:color}} type = {type} className="btn">
      {text}
    </button>

  )
}

export default Button
