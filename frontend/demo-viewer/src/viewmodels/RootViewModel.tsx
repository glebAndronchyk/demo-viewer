import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useRef,
} from "react";
import { AppConfiguration } from "../features/configuration";

const useRoot = () => {
  type Consumer = (type: "update" | "init", e: MessageEvent) => void;

  const subscribers = useRef<Set<Consumer>>(new Set());

  const subscribeToNotification = (cb: Consumer) => {
    subscribers.current.add(cb);
    return () => subscribers.current.delete(cb);
  };

  const acceptGroupInvitation = async (notificationId: string) => {
    await fetch(`${AppConfiguration.apiUrl}/team/accept/invitation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ notificationId }),
    });
  };

  const declineGroupInvitation = async (notificationId: string) => {
    await fetch(`${AppConfiguration.apiUrl}/notifications/${notificationId}/dismiss`, {
      method: "POST",
      credentials: "include",
    });
  };

  useEffect(() => {
    const source = new EventSource(`${AppConfiguration.apiUrl}/notifications/session`, {
      withCredentials: true,
    });

    const initHandler = (e: MessageEvent) => {
      subscribers.current.forEach((s) => s("init", e));
    };

    const updateHandler = (e: MessageEvent) => {
      subscribers.current.forEach((s) => s("update", e));
    };

    source.addEventListener("init", initHandler);
    source.addEventListener("update", updateHandler);

    return () => {
      source.removeEventListener("init", initHandler);
      source.removeEventListener("update", updateHandler);
      source.close();
    };
  }, []);

  return {
    subscribeToNotification,
    acceptGroupInvitation,
    declineGroupInvitation,
  };
};

const RootViewModelContext = createContext<ReturnType<typeof useRoot>>(
  null as never,
);

// eslint-disable-next-line react-refresh/only-export-components
export const useRootViewModel = () => useContext(RootViewModelContext);

export const RootViewModel = (props: PropsWithChildren) => {
  const vm = useRoot();

  return (
    <RootViewModelContext.Provider value={vm}>
      {props.children}
    </RootViewModelContext.Provider>
  );
};
