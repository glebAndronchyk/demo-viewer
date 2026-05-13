import { Layout } from "antd";
import DemoViewer from "../../modules/demo-viewer/components/DemoViewer.tsx";
import { DemoViewerViewModel } from "../../modules/demo-viewer/viewmodel/DemoViewerViewModel.tsx";
import { EventLog } from "./components/EventLog.tsx";
import { DemoPlayerTimeLine } from "./components/DemoPlayerTimeLine.tsx";
import { ScoreOutput } from "./components/ScoreOutput.tsx";
import { PlayersList } from "./components/PlayersList.tsx";

const DemoPlayerPage = () => {
  return (
    <Layout>
      <Layout.Header>
        <ScoreOutput />
      </Layout.Header>
      <Layout style={{ maxHeight: "50vh", minHeight: "50vh" }}>
        <Layout.Content>
          <DemoViewer className="[&_canvas]:w-125! [&_canvas]:h-full! [&_div]:flex [&_div]:justify-center" />
        </Layout.Content>
        <Layout.Sider width="40%">
          <EventLog />
        </Layout.Sider>
      </Layout>
      <Layout.Footer>
        <PlayersList />
        <DemoPlayerTimeLine />
      </Layout.Footer>
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
