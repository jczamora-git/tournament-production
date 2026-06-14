function LoadingState({ message = "Loading..." }) {
  return (
    <div className="admin-loading-state">
      <span>{message}</span>
    </div>
  );
}

export default LoadingState;
