import { Layout } from "antd";
import DemoViewer from "../../modules/demo-viewer/components/DemoViewer.tsx";
import { DemoViewerViewModel } from "../../modules/demo-viewer/viewmodel/DemoViewerViewModel.tsx";
import { EventLog } from "./components/EventLog.tsx";

const DemoPlayerPage = () => {
  return (
    <Layout>
      <Layout.Header>Score: 10/10</Layout.Header>
      <Layout style={{ maxHeight: "50vh" }}>
        <Layout.Content>
          <DemoViewer />
        </Layout.Content>
        <Layout.Sider width="40%">
          <EventLog />
        </Layout.Sider>
      </Layout>
      <Layout.Footer>Test</Layout.Footer>
    </Layout>
  );
};

export default function _() {
  return (
    <DemoViewerViewModel>
      <DemoPlayerPage />
    </DemoViewerViewModel>
  );
}
