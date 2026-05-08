import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Post from "./pages/Post";
import New from "./pages/New";
import Edit from "./pages/Edit";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/posts/:slug" element={<Post />} />
        <Route path="/new" element={<New />} />
        <Route path="/edit/:slug" element={<Edit />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
