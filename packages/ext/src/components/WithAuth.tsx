function WithAuth<T extends object>(WrappedComponent: React.ComponentType<T>) {
	return (props: T) => <WrappedComponent {...props} />;
}

export default WithAuth;