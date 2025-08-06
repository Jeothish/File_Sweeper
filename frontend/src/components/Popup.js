const popup = ({ title, message, onArchive, onDelete, onCancel }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-box">
        {title && <h2>{title}</h2>}
        <p>{message}</p>
        <div className="modal-actions">
          <Button
            color='blue'
            text='Archive'
            onClick={onArchive}
            type='button'
          />
          <Button
            color='red'
            text='Delete'
            onClick={onDelete}
            type='button'
          />
          <Button
            color='gray'
            text='Cancel'
            onClick={onCancel}
            type='button'
          />
        </div>
      </div>
    </div>
  );
};

export default Popup;