import React, { useEffect } from 'react'
import * as S from './Ecosystem.styles'
import Button from 'components/button/Button'
import { Outlet, useNavigate, useParams } from 'react-router-dom'
import { ECOSYSTEM_CATEGORY, BOBA_PROJECTS_CATEGORY, ROUTES_PATH } from 'util/constant'

function ECOSYSTEM({ ecosystemType }) {
  const navigate = useNavigate();
  const params = useParams();

  useEffect(() => {
    if (!params.category) {
      if (ecosystemType !== 'BOBA') {
        navigate(`${ROUTES_PATH.ECOSYSTEM}/defi`)
      } else {
        navigate(`${ROUTES_PATH.BOBA_CHAINS}/mainnet`)
      }
    }
  }, [ params, navigate, ecosystemType ]);

  return (
    <S.EcoSystemPageContainer>
      <S.CategoryList>
        {(ecosystemType !== 'BOBA' ? ECOSYSTEM_CATEGORY : BOBA_PROJECTS_CATEGORY).map((cat, i) => {
          return <Button
            key={i}
            onClick={() => {
              navigate(`${ecosystemType !== 'BOBA' ? ROUTES_PATH.ECOSYSTEM : ROUTES_PATH.BOBA_CHAINS}/${cat}`)
            }}
            sx={{ textTransform: 'uppercase' }}
            variant={params.category === cat ? "contained" : "standard"}
            color="secondary"
            size="small"
          >{cat}</Button>
        })}
      </S.CategoryList>
      <S.DividerLine />
      <S.ProjectListContainer container
        spacing={{ xs: 2, md: 2 }}
        columns={{ xs: 5, sm: 13, md: 13 }}
      >
        <Outlet />
      </S.ProjectListContainer>
    </S.EcoSystemPageContainer>
  )

}


export default React.memo(ECOSYSTEM);
