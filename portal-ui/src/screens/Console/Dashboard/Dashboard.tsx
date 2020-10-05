// This file is part of MinIO Console Server
// Copyright (c) 2020 MinIO, Inc.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

import React, { useEffect, useState } from "react";
import { createStyles, Theme, withStyles } from "@material-ui/core/styles";
import clsx from "clsx";
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import NetworkCheckIcon from "@material-ui/icons/NetworkCheck";
import PieChartIcon from "@material-ui/icons/PieChart";
import ViewHeadlineIcon from "@material-ui/icons/ViewHeadline";
import { Usage } from "./types";
import api from "../../../common/api";
import { niceBytes } from "../../../common/utils";
import { LinearProgress } from "@material-ui/core";
import PageHeader from "../Common/PageHeader/PageHeader";
import { containerForHeader } from "../Common/FormComponents/common/styleLibrary";

const styles = (theme: Theme) =>
  createStyles({
    root: {
      display: "flex",
    },
    toolbar: {
      paddingRight: 24, // keep right padding when drawer closed
    },
    toolbarIcon: {
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-end",
      padding: "0 8px",
      ...theme.mixins.toolbar,
    },
    appBar: {
      zIndex: theme.zIndex.drawer + 1,
      transition: theme.transitions.create(["width", "margin"], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
    },

    menuButton: {
      marginRight: 36,
    },
    menuButtonHidden: {
      display: "none",
    },
    title: {
      flexGrow: 1,
    },
    drawerPaperClose: {
      overflowX: "hidden",
      transition: theme.transitions.create("width", {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
      width: theme.spacing(7),
      [theme.breakpoints.up("sm")]: {
        width: theme.spacing(9),
      },
    },
    appBarSpacer: theme.mixins.toolbar,
    content: {
      flexGrow: 1,
      height: "100vh",
      overflow: "auto",
    },
    ...containerForHeader(theme.spacing(4)),
    paper: {
      padding: theme.spacing(2),
      display: "flex",
      overflow: "auto",
      flexDirection: "column",
      border: "#eaedee 1px solid",
      borderRadius: 5,
      boxShadow: "none",
    },
    fixedHeight: {
      minHeight: 165,
      minWidth: 247,
      marginRight: 20,
    },
    consumptionValue: {
      color: "#000000",
      fontSize: "60px",
      fontWeight: "bold",
    },
    icon: {
      marginRight: 10,
      color: "#777777",
    },
    notationContainer: {
      display: "flex",
    },
  });

interface IDashboardProps {
  classes: any;
}

const Dashboard = ({ classes }: IDashboardProps) => {
  const fixedHeightPaper = clsx(classes.paper, classes.fixedHeight);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (loading) {
      fetchUsage();
    }
  }, [loading]);

  const fetchUsage = () => {
    api
      .invoke("GET", `/api/v1/admin/info`)
      .then((res: Usage) => {
        setUsage(res);
        setError("");
        setLoading(false);
      })
      .catch((err) => {
        setError(err);
        setLoading(false);
      });
  };
  const prettyUsage = (usage: string | undefined) => {
    if (usage === undefined) {
      return "0";
    }
    return niceBytes(usage);
  };

  const prettyNumber = (usage: number | undefined) => {
    if (usage === undefined) {
      return 0;
    }

    return usage.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  return (
    <React.Fragment>
      <PageHeader label="Dashboard" />
      <Grid container>
        <Grid container spacing={3} className={classes.container}>
          {error !== "" && <Grid container>{error}</Grid>}
          {loading ? (
            <Grid item xs={12} md={12} lg={12}>
              <LinearProgress />
            </Grid>
          ) : (
            <React.Fragment>
              <Grid item className={classes.notationContainer}>
                <Paper className={fixedHeightPaper}>
                  <Grid container direction="row" alignItems="center">
                    <Grid item className={classes.icon}>
                      <ViewHeadlineIcon />
                    </Grid>
                    <Grid item>
                      <Typography variant="h6">All Buckets</Typography>
                    </Grid>
                  </Grid>
                  <Typography className={classes.consumptionValue}>
                    {usage ? prettyNumber(usage.buckets) : 0}
                  </Typography>
                </Paper>
                <Paper className={fixedHeightPaper}>
                  <Grid container direction="row" alignItems="center">
                    <Grid item className={classes.icon}>
                      <PieChartIcon />
                    </Grid>
                    <Grid item>
                      <Typography variant="h6">Usage</Typography>
                    </Grid>
                  </Grid>
                  <Typography className={classes.consumptionValue}>
                    {usage ? prettyUsage(usage.usage + "") : 0}
                  </Typography>
                </Paper>
                <Paper className={fixedHeightPaper}>
                  <Grid container direction="row" alignItems="center">
                    <Grid item className={classes.icon}>
                      <NetworkCheckIcon />
                    </Grid>
                    <Grid item>
                      <Typography variant="h6"> Total Objects</Typography>
                    </Grid>
                  </Grid>
                  <Typography className={classes.consumptionValue}>
                    {usage ? prettyNumber(usage.objects) : 0}
                  </Typography>
                </Paper>
              </Grid>
            </React.Fragment>
          )}
        </Grid>
      </Grid>
    </React.Fragment>
  );
};

export default withStyles(styles)(Dashboard);
