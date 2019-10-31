import React, { useState, useContext } from "react";
import { Mutation } from "react-apollo";
import { gql } from "apollo-boost";
import axios from "axios";
import withStyles from "@material-ui/core/styles/withStyles";
import IconButton from "@material-ui/core/IconButton";
import EditIcon from "@material-ui/icons/Edit";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import FormControl from "@material-ui/core/FormControl";
import FormHelperText from "@material-ui/core/FormHelperText";
import DialogTitle from "@material-ui/core/DialogTitle";
import CircularProgress from "@material-ui/core/CircularProgress";
import LibraryMusicIcon from "@material-ui/icons/LibraryMusic";
import Error from "../Shared/Error";
import { UserContext } from "../../Root";

const UpdateTrack = ({ classes, track }) => {
  const currentUser = useContext(UserContext);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(track.title);
  const [description, setDescription] = useState(track.description);
  const [file, setFile] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fileError, setFileError] = useState("");

  const handleFile = event => {
    const selectedFile = event.target.files[0];
    const fileSizeLimit = 10000000; // 10mb
    if (selectedFile && selectedFile.size > fileSizeLimit) {
      setFileError(`${selectedFile.name}: is to large`);
    } else {
      setFile(selectedFile);
      setFileError("");
    }
  };

  const handleAudioUpload = async () => {
    try {
      const newDdata = new FormData();
      const cloudName = "xarala";
      newDdata.append("file", file);
      newDdata.append("resource_type", "raw");
      newDdata.append("upload_preset", "react-tracks");
      newDdata.append("cloud_name", cloudName);
      const { data } = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`,
        newDdata
      );
      return data.url;
    } catch (error) {
      console.error("Error uploading track ", error);
      setSubmitting(false);
    }
  };

  const handleSubmit = async (event, updateTrack) => {
    event.preventDefault();
    setSubmitting(true);
    const trackId = track.id;
    // upload file and get returned url from api
    const uploadedUrl = await handleAudioUpload();
    updateTrack({
      variables: {
        trackId,
        title,
        description,
        url: uploadedUrl
      }
    });
  };

  const isCurrentUser = currentUser.id === track.postedBy.id;

  return (
    isCurrentUser && (
      <>
        {/* edit button */}
        <IconButton onClick={() => setOpen(true)}>
          <EditIcon />
        </IconButton>
        {/* dialog button */}
        <Mutation
          mutation={UPDATE_TRACK_MUTATION}
          onCompleted={data => {
            setSubmitting(false);
            setOpen(false);
            setTitle("");
            setDescription("");
            setFile("");
          }}
          // refetchQueries={() => [{ query: GET_TRACKS_QUERY }]}
        >
          {(updateTrack, { loading, error }) => {
            if (error) return <Error error={error} />;
            return (
              <Dialog className={classes.dialog} open={open}>
                <form onSubmit={event => handleSubmit(event, updateTrack)}>
                  <DialogTitle> Update Track </DialogTitle>
                  <DialogContent>
                    <DialogContentText>
                      Add a title, description & audio file(Under 10 MB)
                    </DialogContentText>
                    <FormControl fullWidth>
                      <TextField
                        label="Title"
                        placeholder="Add title"
                        className={classes.textField}
                        onChange={event => setTitle(event.target.value)}
                        value={title}
                      />
                    </FormControl>
                    <FormControl fullWidth>
                      <TextField
                        multiline
                        rows="4"
                        label="Description"
                        placeholder="Add description"
                        className={classes.textField}
                        onChange={event => setDescription(event.target.value)}
                        value={description}
                      />
                    </FormControl>
                    <FormControl error={Boolean(fileError)}>
                      <input
                        id="audio"
                        required
                        type="file"
                        accept="audio/mp3,audio/wav"
                        className={classes.input}
                        onChange={handleFile}
                      />
                      <label htmlFor="audio">
                        <Button
                          variant="outlined"
                          color={file ? "secondary" : "inherit"}
                          component="span"
                          className={classes.button}
                        >
                          Audio file{" "}
                          <LibraryMusicIcon className={classes.icon} />
                        </Button>
                        {file && file.name}
                        <FormHelperText> {fileError} </FormHelperText>
                      </label>
                    </FormControl>
                  </DialogContent>
                  <DialogActions>
                    <Button
                      disabled={submitting}
                      className={classes.cancel}
                      onClick={() => setOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className={classes.save}
                      disabled={
                        submitting ||
                        !title.trim() ||
                        !description.trim() ||
                        !file
                      }
                    >
                      {submitting ? (
                        <CircularProgress size={24} className={classes.save} />
                      ) : (
                        "Update Track"
                      )}
                    </Button>
                  </DialogActions>
                </form>
              </Dialog>
            );
          }}
        </Mutation>
      </>
    )
  );
};

const UPDATE_TRACK_MUTATION = gql`
  mutation($trackId: Int!, $title: String, $description: String, $url: String) {
    updateTrack(
      trackId: $trackId
      title: $title
      description: $description
      url: $url
    ) {
      track {
        id
        title
        description
        url
      }
    }
  }
`;

const styles = theme => ({
  container: {
    display: "flex",
    flexWrap: "wrap"
  },
  dialog: {
    margin: "0 auto",
    maxWidth: 550
  },
  textField: {
    margin: theme.spacing.unit
  },
  cancel: {
    color: "red"
  },
  save: {
    color: "green"
  },
  button: {
    margin: theme.spacing.unit * 2
  },
  icon: {
    marginLeft: theme.spacing.unit
  },
  input: {
    display: "none"
  }
});

export default withStyles(styles)(UpdateTrack);
