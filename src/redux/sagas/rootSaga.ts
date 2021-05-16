import * as api from '@app/api/api';
import { history } from '@app/App';
import {
  FETCH_MAIN_MOVIES_SUCCESS,
  FETCH_SELECTED_MOVIE_SUCCESS,
  FETCH_SELECTED_PERSON_SUCCESS,
  IS_LOADING,
  SEARCH_SUCCESS, UPDATE_QUERY,
  UPDATE_SEARCH_QUERY
} from '@app/constants/actionType';
import { IFilterProps } from '@app/types/types';
import { all, call, put, select } from 'redux-saga/effects';

function updateQuery({ year, sort, genre }: IFilterProps) {
  const yearFilter = year ? `&year=${year}&first_air_date_year=${year}` : '';
  const sortFilter = sort ? `&sort_by=${sort}` : '';
  const genreFilter = genre ? `&with_genres=${genre}` : '';
  return `${yearFilter}${sortFilter}${genreFilter}`;
}

function* init() {
  yield put({ type: IS_LOADING, payload: true });
}

function* errorHandler(err: any) {
  console.log(err);
  yield put({ type: IS_LOADING, payload: false });

  if (!navigator.onLine) {
    yield call(history.push, '/network-error');
  } else {
    yield call(history.push, '/error');
  }
}

export function* fetchRequestSaga({ type, payload }: ISagaParams): any {
  const { query, page } = payload;

  try {
    yield init();
    const data = yield call(api.fetchRequest, query, page);
    yield put({ type: `${type}_SUCCESS`, payload: data });
    yield put({ type: IS_LOADING, payload: false });
    window.scrollTo(0, 0);
  } catch (e) {
    yield call(errorHandler, e);
  }
}

interface ISagaParams {
  payload: any;
  type: any;
}

export function* updateFilterQuerySaga({ payload }: ISagaParams): any {
  const { target } = payload;

  try {
    const filters = yield select(state => state.filters);

    const query = updateQuery(filters[target]);
    yield put({ type: UPDATE_QUERY, payload: { query, target } });
  } catch (e) {
    console.log(e);
    yield put({ type: IS_LOADING, payload: false });
  }
}

export function* fetchSelectedMovieSaga({ payload }: ISagaParams): any {
  const { category, id } = payload;

  try {
    yield init();

    const [movie, keywords, casts, reviews] = yield all([
      call(api.fetchMovie, category, id),
      call(api.fetchMovieKeywords, category, id),
      call(api.fetchMovieCredits, category, id),
      call(api.fetchMovieReviews, category, id),
    ]);

    yield put({
      type: FETCH_SELECTED_MOVIE_SUCCESS,
      payload: {
        movie,
        keywords,
        casts,
        reviews,
      },
    });
    yield put({ type: IS_LOADING, payload: false });
  } catch (e) {
    yield call(errorHandler, e);
  }
}

// Fetching movies, tv-shows, and people all together
export function* searchSaga({ payload }: ISagaParams): any {
  const { query } = payload;

  try {
    yield init();
    const [tv, movies, people] = yield all([
      call(api.searchTv, query),
      call(api.searchMovie, query),
      call(api.searchPerson, query),
    ]);

    yield put({
      type: SEARCH_SUCCESS,
      payload: {
        movies,
        tv,
        people,
      },
    });
    yield put({ type: IS_LOADING, payload: false });
    yield put({ type: UPDATE_SEARCH_QUERY, payload: query });
  } catch (e) {
    yield call(errorHandler, e);
  }
}

// Fetching popular, top-rated, and upcoming movies for home page
export function* fetchMainMoviesSaga(): any {
  try {
    yield init();
    const [popular, topRated, upcoming] = yield all([
      call(api.fetchRequest, '/movie/popular', 1),
      call(api.fetchRequest, '/movie/top_rated', 1),
      call(api.fetchRequest, '/movie/upcoming', 1),
    ]);

    yield put({
      type: FETCH_MAIN_MOVIES_SUCCESS,
      payload: {
        popular,
        topRated,
        upcoming,
      },
    });
    yield put({ type: IS_LOADING, payload: false });
  } catch (e) {
    yield call(errorHandler, e);
  }
}

export function* fetchSelectedPersonSaga({ payload }: ISagaParams): any {
  try {
    yield init();
    const [actor, casting] = yield all([
      call(api.fetchPerson, payload),
      call(api.fetchPersonCasting, payload),
    ]);

    yield put({ type: IS_LOADING, payload: false });
    yield put({
      type: FETCH_SELECTED_PERSON_SUCCESS,
      payload: { actor, casting },
    });
  } catch (e) {
    yield call(errorHandler, e);
  }
}

